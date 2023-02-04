import { NextFunction, Request, Response } from "express";
var { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const { productIntroTemplate } = require("../../templates/product.template");

module.exports.updateStockController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const db = await dbConnection();

      const productId: String = req.headers.authorization || "";
      const body = req.body;
      const storeName = req.params.storeName;

      if (productId && body && storeName) {
         let stock = body?.variations?.available <= 1 ? "out" : "in";

         const result = await db.collection("products").updateOne(
            { $and: [{ _id: ObjectId(productId) }, { 'sellerData.storeName': storeName }] },
            {
               $set: {
                  "variations.$[i].available": body?.variations?.available,
                  "variations.$[i].stock": stock,
               },
            },
            {
               arrayFilters: [{ 'i._vId': body?.variations?._vId }]
            },
            { upsert: true }
         );

         if (!result) {
            return res.status(503).send({
               success: false,
               statusCode: 503,
               error: "Failed to update stock quantity !!!",
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
      const db = await dbConnection();

      const productId: String = req.headers?.authorization || "";
      const formTypes = req.query.formType || "";
      const vId = req.query.vId;
      const productAttr = req.query.attr;
      let result;
      let model = req.body;

      // Update variation
      if (formTypes === 'update-variation') {
         model['_vId'] = vId;
         if (vId && productAttr === 'ProductVariations') {
            result = await db.collection('products').updateOne(
               {
                  $and: [{ _id: ObjectId(productId) }, { 'variations._vId': vId }]
               },
               {
                  $set: {
                     'variations.$[i]': model,
                  }
               },
               { arrayFilters: [{ "i._vId": vId }] }
            );
         }
      }

      // create new variation
      if (formTypes === 'new-variation') {
         result = await db.collection('products').updateOne(
            {
               _id: ObjectId(productId)
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

            result = await db.collection('products').updateOne(
               { _id: ObjectId(productId) },
               {
                  $set: { specification: model }
               },
               { upsert: true }
            );
         }

         if (productAttr === 'bodyInformation') {

            result = await db.collection('products').updateOne(
               { _id: ObjectId(productId) },
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

      const db = await dbConnection();

      const body = req.body;
      let result: any;

      if (body?.market_place !== 'woo-kart') {
         return res.status(403).send({ success: false, statusCode: 403, error: "Forbidden." });
      }

      if (body?.data?.vId) {

         result = await db.collection('products').updateOne(
            { $and: [{ _id: ObjectId(body?.data?.pId) }, { _lId: body?.data?.lId }, { save_as: 'fulfilled' }] },
            { $set: { 'variations.$[i].status': body?.data?.action } },
            { arrayFilters: [{ "i._vId": body?.data?.vId }] });

      } else {
         result = await db.collection('products').updateOne(
            { $and: [{ _id: ObjectId(body?.data?.pId) }, { _lId: body?.data?.lId }] },
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
      const db = await dbConnection();

      // await db.collection("products").createIndex({ _lId: 1, slug: 1, save_as: 1, categories: 1, brand: 1, "sellerData.storeName": 1, "sellerData.sellerName": 1, "sellerData.sellerId": 1 });

      const authEmail = req.decoded.email;
      const role = req.decoded.role;

      const user = await db.collection("users").findOne({ $and: [{ email: authEmail }, { role }] });

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

         if (filters === 'all') {
            src = [{}];
         } else {
            src = [{ categories: {$in: [filters]} }];
         }

      }

      products = await db.collection("products").aggregate([
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
      ]).toArray();

      draftProducts = await db.collection("products").find({
         $and: [user?.role === 'SELLER' && { "sellerData.storeName": user?.seller?.storeInfos?.storeName }, { save_as: "draft" }],
      }).toArray();

      inactiveProduct = await db.collection("products").aggregate([
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
      ]).toArray();


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
* @required        --> [req.query:seller, req.query:productId, req.query:variationId]
* @request_method  --> GET
*/
module.exports.getProductForSellerDSBController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const db = await dbConnection();

      const productId = req.query.pid;
      const variationId = req.query.vId;
      const storeName = req.query.storeName;

      let product;

      if (!storeName && typeof storeName === 'undefined' && !productId) return res.status(204).send();

      if (variationId && typeof variationId === 'string') {
         product = await db.collection('products').aggregate([
            {
               $match: { _id: ObjectId(productId) }
            },
            {
               $unwind: { path: "$variations" },
            },
            {
               $match: { 'variations._vId': variationId }
            }
         ]).toArray();
         product = product[0];

      } else {
         product = await db.collection("products").findOne({
            $and: [{ _id: ObjectId(productId) }, { "sellerData.storeName": storeName }],
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
module.exports.setProductIntroController = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const db = await dbConnection();
      const authEmail = req.decoded.email;
      const formTypes = req.params.formTypes;
      const body = req.body;
      const lId = req.headers?.authorization || null;
      let model;

      const user = await db
         .collection("users")
         .findOne({ $and: [{ email: authEmail }, { role: 'SELLER' }] });

      if (!user) {
         return res
            .status(401)
            .send({ success: false, statusCode: 401, error: "Unauthorized" });
      }

      if (formTypes === "update" && lId) {
         model = productIntroTemplate(body);
         model['modifiedAt'] = new Date(Date.now());

         let result = await db
            .collection("products")
            .updateOne(
               { _lId: lId },
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
         model = productIntroTemplate(body);
         model['_lId'] = "LID" + Math.random().toString(36).toUpperCase().slice(2, 18);
         model['sellerData'] = {};
         model.sellerData.sellerId = user?._UUID;
         model.sellerData.sellerName = user?.fullName;
         model.sellerData.storeName = user?.seller?.storeInfos?.storeName;
         model['createdAt'] = new Date(Date.now());

         model["rating"] = [
            { weight: 5, count: 0 },
            { weight: 4, count: 0 },
            { weight: 3, count: 0 },
            { weight: 2, count: 0 },
            { weight: 1, count: 0 },
         ];
         model["ratingAverage"] = 0;
         model['reviews'] = [];
         model['save_as'] = 'draft';

         let result = await db.collection('products').insertOne(model);

         if (result) {
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
      const db = await dbConnection();

      const productId = req.params.productId;
      const _vId = req.params.vId;
      const storeName = req.params.storeName;

      const product = await db.collection('products').findOne({ $and: [{ _id: ObjectId(productId) }, { "sellerData.storeName": storeName }] });

      if (!product) {
         return res.status(404).send({ success: false, statusCode: 404, error: 'Sorry! Product not found!!!' });
      }

      if (product && Array.isArray(product?.variations) && product?.variations.length <= 1) {
         return res.status(200).send({ success: false, statusCode: 200, message: "Please create another variation before delete this variation !" });
      }

      const result = await db.collection('products').updateOne(
         { $and: [{ _id: ObjectId(productId) }, { "sellerData.storeName": storeName }] },
         { $pull: { variations: { _vId } } }
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
      const db = await dbConnection();

      const productId: string = req.headers?.authorization?.split(',')[0] || "";
      const _lId: string = req.headers?.authorization?.split(',')[1] || "";
      const storeName = req.params.storeName;

      //return --> "acknowledged" : true, "deletedCount" : 1
      const deletedProduct = await db.collection("products").deleteOne({
         $and: [
            { _id: ObjectId(productId) },
            { _lId },
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
