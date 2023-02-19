// ManageProduct.Controller.tsx

import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const { product_listing_template_engine } = require("../../templates/product.template");
const User = require("../../model/user.model");
const QueueProduct = require("../../model/queueProduct.model");
const Product = require("../../model/product.model");



// Controllers
module.exports.updateStockController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const productID: String = req.headers.authorization || "";
      const body = req.body;
      const storeName = req.params.storeName;

      if (!body?.variations?._VID || !body?.variations?.available) {
         throw new Error("Variation ID and unit required !");
      }

      if (productID && body && storeName) {
         let stock = body?.variations?.available <= 1 ? "out" : "in";

         const result = await Product.findOneAndUpdate(
            { $and: [{ _id: ObjectId(productID) }, { 'sellerData.storeName': storeName }] },
            {
               $set: {
                  "variations.$[i].available": body?.variations?.available,
                  "variations.$[i].stock": stock,
               },
            },
            {
               arrayFilters: [{ "i._VID": body?.variations?._VID }]
            }
         );


         if (!result) {
            return res.status(500).send({
               success: false,
               statusCode: 500,
               name: "Server Error",
               message: "Failed to update stock quantity !!!",
            });
         }

         return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Product stock updated successfully.",
         });
      }
   } catch (error: any) {
      next(error);
   }
};

// product variation controller
module.exports.productOperationController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const productID: String = req.headers?.authorization || "";
      const formTypes = req.query.formType || "";
      const vId = req.query.vId;
      const productAttr = req.query.attr;
      let result;
      let model = req.body;

      // Update variation
      if (formTypes === 'update-variation') {
         model['_VID'] = vId;
         if (vId && productAttr === 'ProductVariations') {
            result = await Product.findOneAndUpdate(
               {
                  $and: [{ _id: ObjectId(productID) }, { 'variations._VID': vId }]
               },
               {
                  $set: {
                     'variations.$[i]': model,
                  }
               },
               { arrayFilters: [{ "i._VID": vId }] }
            );
         }
      }

      // create new variation
      if (formTypes === 'new-variation') {
         result = await Product.updateOne(
            {
               _id: ObjectId(productID)
            },
            {
               $push: { variations: model }
            },
            { upsert: true }
         );
      }

      // next condition
      else if (formTypes === 'update') {

         if (productAttr === 'ProductSpecs') {

            result = await Product.updateOne(
               { _id: ObjectId(productID) },
               {
                  $set: { specification: model }
               },
               { upsert: true }
            );
         }

         if (productAttr === 'bodyInformation') {

            result = await Product.updateOne(
               { _id: ObjectId(productID) },
               {
                  $set: { bodyInfo: model }
               },
               { upsert: true }
            );
         }
      }

      if (result) {
         return res.status(200).send({ success: true, statusCode: 200, message: "Data Saved" });
      }
      return res.status(500).send({ success: false, statusCode: 500, error: "Failed" });

   } catch (error: any) {
      next(error);
   }
}


module.exports.productControlController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const body = req.body;
      let result: any;

      if (body?.market_place !== 'woo-kart') {
         return res.status(403).send({ success: false, statusCode: 403, error: "Forbidden." });
      }

      if (body?.data?.vId) {

         result = await Product.findOneAndUpdate(
            {
               $and: [
                  { _id: ObjectId(body?.data?.pId) },
                  { _LID: body?.data?.lId },
                  { save_as: 'fulfilled' }
               ]
            },
            { $set: { 'variations.$[i].status': body?.data?.action } },
            { arrayFilters: [{ "i._VID": body?.data?.vId }] }
         );

      } else {
         result = await Product.findOneAndUpdate(
            {
               $and: [
                  { _id: ObjectId(body?.data?.pId) },
                  { _LID: body?.data?.lId }
               ]
            },
            { $set: { save_as: body?.data?.action, "variations.$[].status": "inactive" } },
            { upsert: true, multi: true });
      }

      if (result) {
         return res.status(200).send({ success: true, statusCode: 200, message: `Request ${body?.data?.action} successful.` });
      }

   } catch (error: any) {
      next(error);
   }
}



module.exports.viewAllProductsInDashboard = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      // await db.collection("products").createIndex({ _LID: 1, slug: 1, save_as: 1, categories: 1, brand: 1, "sellerData.storeName": 1, "sellerData.sellerName": 1, "sellerData.sellerID": 1 });

      const authEmail = req.decoded.email;
      const role = req.decoded.role;

      const user = await User.findOne({ $and: [{ email: authEmail }, { role }] });

      let item: any;
      let page: any;
      item = req.query.items;
      page = req.query.page;
      let searchText: any = req.query.search;
      let filters: any = req.query.category;
      let products: any;
      let draftProducts: any;
      let inactiveProduct: any;

      let showFor: any[];
      let src: any[] = [];

      if (user.role === 'SELLER') {
         showFor = [
            { "sellerData.storeName": user?.seller?.storeInfos?.storeName },
            { save_as: "fulfilled" },
            { isVerified: true }
         ];
      } else {
         showFor = [{ 'variations.status': "active" }, { save_as: "fulfilled" }];
      }

      page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;

      if (searchText) {
         filters = '';
         src = [
            { title: { $regex: searchText, $options: "i" } },
            { "sellerData.storeName": { $regex: searchText, $options: "i" } },
         ]
      } else if (filters) {
         searchText = '';
         src = [{ categories: { $in: [filters] } }];
      } else {
         src = [{}];
      }

      products = await Product.aggregate([
         {
            $match: {
               $and: showFor,
               $or: src
            }
         },
         {
            $skip: page * parseInt(item)
         }, {
            $limit: (parseInt(item))
         }
      ]);

   //  products = await Product.aggregate([
   //       { $match: { $and: showFor, $or: src } },
   //       { $unwind: { path: "$variations" } },
   //       { $replaceRoot: { newRoot: { $mergeObjects: ["$variations", "$$ROOT"] } } },
   //       { $unset: ["variations"] },
   //       { $skip: page * parseInt(item) },
   //       { $limit: (parseInt(item)) }
   //    ]);

      draftProducts = await Product.find({
         $and: [user?.role === 'SELLER' && { "sellerData.storeName": user?.seller?.storeInfos?.storeName }, { save_as: "draft" }],
      });

      inactiveProduct = await Product.aggregate([
         { $unwind: { path: "$variations" } },
         {
            $match: {
               $and: [
                  { save_as: 'fulfilled' },
                  user?.role === 'SELLER' && { "sellerData.storeName": user?.seller?.storeInfos?.storeName },
                  { "variations.status": 'inactive' }
               ]
            }
         }
      ]);


      return res.status(200).send({
         success: true,
         statusCode: 200,
         data: { products, draftProducts, inactiveProduct },
      });
   } catch (error: any) {
      next(error);
   }
};


/**
* @controller      --> Fetch the single product in product edit page.
* @required        --> [req.query:seller, req.query:productID, req.query:variationID]
* @request_method  --> GET
*/
module.exports.getProductForSellerDSBController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const productID = req.query.pid;
      const variationID = req.query.vId;
      const storeName = req.query.storeName;

      let product;

      if (!storeName && typeof storeName === 'undefined' && !productID) return res.status(204).send();

      if (variationID && typeof variationID === 'string') {
         product = await Product.aggregate([
            {
               $match: { _id: ObjectId(productID) }
            },
            {
               $unwind: { path: "$variations" },
            },
            {
               $match: { 'variations._VID': variationID }
            }
         ]);
         product = product[0];

      } else {
         product = await Product.findOne({
            $and: [{ _id: ObjectId(productID) }, { "sellerData.storeName": storeName }],
         });
      }

      return product
         ? res.status(200).send(product)
         : res.status(404).send({
            success: false,
            statusCode: 404,
            error: "Product not found!!!",
         });
   } catch (error: any) {
      next(error);
   }
};



/**
 * Adding Product Title and slug first
 */
module.exports.productListingController = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const authEmail = req.decoded.email;
      const formTypes = req.params.formTypes;
      const body = req.body;
      const lId = req.headers?.authorization || null;
      let model;

      const user = await User.findOne({ $and: [{ email: authEmail }, { role: 'SELLER' }] });

      if (!user) {
         return res
            .status(401)
            .send({ success: false, statusCode: 401, error: "Unauthorized" });
      }

      if (formTypes === "update" && lId) {
         model = product_listing_template_engine(body);
         model['modifiedAt'] = new Date(Date.now());
         model.sellerData.sellerID = user?._UUID;
         model.sellerData.sellerName = user?.fullName;
         model.sellerData.storeName = user?.seller?.storeInfos?.storeName;

         let result = await Product.updateOne(
            { _LID: lId, save_as: { $and: ['draft', 'fulfilled'] } },
            { $set: model },
            { upsert: true }
         );

         if (result) {
            return res.status(200).send({
               success: true,
               statusCode: 200,
               message: "Product updated successfully.",
            })
         } else {
            return res.status(400).send({
               success: false,
               statusCode: 400,
               error: "Operation failed!!!",
            });
         }
      }

      if (formTypes === 'create') {
         model = product_listing_template_engine(body);
         model.sellerData.sellerID = user?._UUID;
         model.sellerData.sellerName = user?.fullName;
         model.sellerData.storeName = user?.seller?.storeInfos?.storeName;

         model["rating"] = [
            { weight: 5, count: 0 },
            { weight: 4, count: 0 },
            { weight: 3, count: 0 },
            { weight: 2, count: 0 },
            { weight: 1, count: 0 },
         ];
         model["ratingAverage"] = 0;
         model['reviews'] = [];
         model['save_as'] = 'queue';

         let queueProduct = new QueueProduct(model);
         let results = await queueProduct.save();

         if (results) {
            return res.status(200).send({
               success: true,
               statusCode: 200,
               message: "Data saved.",
            });
         }
      }
   } catch (error: any) {
      next(error);
   }
};


// delete product variation controller
module.exports.deleteProductVariationController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const productID = req.params.productID;
      const _VID = req.params.vId;
      const storeName = req.params.storeName;

      const product = await Product.findOne({ $and: [{ _id: ObjectId(productID) }, { "sellerData.storeName": storeName }] });

      if (!product) {
         return res.status(404).send({ success: false, statusCode: 404, error: 'Sorry! Product not found!!!' });
      }

      if (product && Array.isArray(product?.variations) && product?.variations.length <= 1) {
         return res.status(200).send({ success: false, statusCode: 200, message: "Please create another variation before delete this variation !" });
      }

      const result = await Product.updateOne(
         { $and: [{ _id: ObjectId(productID) }, { "sellerData.storeName": storeName }] },
         { $pull: { variations: { _VID } } }
      );

      if (result) {
         return res.status(200).send({ success: true, statusCode: 200, message: 'Variation deleted successfully.' });
      }

      return res.status(500).send({ success: false, statusCode: 500, message: 'Failed to delete!!!' });

   } catch (error: any) {
      next(error);
   }
}



module.exports.deleteProductController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const productID: string = req.headers?.authorization?.split(',')[0] || "";
      const _LID: string = req.headers?.authorization?.split(',')[1] || "";
      const storeName = req.params.storeName;

      //return --> "acknowledged" : true, "deletedCount" : 1
      const deletedProduct = await Product.deleteOne({
         $and: [
            { _id: ObjectId(productID) },
            { _LID },
            { 'sellerData.storeName': storeName }
         ]
      });

      if (!deletedProduct.deletedCount) {
         return res.status(503).send({
            success: false,
            statusCode: 503,
            error: "Service unavailable",
         });
      }

      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: "Product deleted successfully.",
      });
   } catch (error: any) {
      next(error);
   }
};




module.exports.productFlashSaleController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const storeName = req.params.storeName;

      const body = req.body;

      const productID = body?.data?.productID;

      const listingID = body?.data?.listingID;

      const fSale = body?.data?.fSale;

      const product = await Product.findOne({ $and: [{ _id: ObjectId(productID) }, { _LID: listingID }, { "sellerData.storeName": storeName }] });


      if (!product) {
         return res.status(200).send({ success: false, statusCode: 200, message: "Product Not found !" });
      }

      const result = await Product.updateOne(
         {
            $and:
               [
                  { _id: ObjectId(productID) }, { _LID: listingID }, { "sellerData.storeName": storeName }
               ]
         },

         {
            $set: {
               isFlashSale: true,
               flashSale: fSale
            }
         },

         {
            upsert: true
         }
      );


      if (result) {
         return res.status(200).send({ success: true, statusCode: 200, message: "Flash Sale Starting...." })
      }


   } catch (error: any) {
      next(error);
   }
}





