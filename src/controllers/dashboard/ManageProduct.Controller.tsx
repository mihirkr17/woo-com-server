// ManageProduct.Controller.tsx

import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const { product_listing_template_engine } = require("../../templates/product.template");
const User = require("../../model/user.model");
const QueueProduct = require("../../model/queueProduct.model");
const Product = require("../../model/product.model");
const { product_variation_template_engine } = require("../../templates/product.template");
const apiResponse = require("../../errors/apiResponse");



// Controllers
module.exports.updateStockController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const storeName = req.params.storeName;

      const { productID, variations } = req?.body;

      if (!variations?._vrid || !variations?.available)
         throw new apiResponse.Api400Error("Variation ID and unit required !");


      if (productID && storeName) {
         let stock = variations?.available <= 1 ? "out" : "in";

         const result = await Product.findOneAndUpdate(
            { $and: [{ _id: ObjectId(productID) }, { 'supplier.store_name': storeName }] },
            {
               $set: {
                  "variations.$[i].available": variations?.available,
                  "variations.$[i].stock": stock,
               },
            },
            {
               arrayFilters: [{ "i._vrid": variations?._vrid }]
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
module.exports.variationController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { formType, requestFor } = req.query;

      let result: any;

      if (!formType || formType === "") throw new apiResponse.Api400Error("Required form type !");

      const { request } = req.body;

      if (!req.body || !req.body.hasOwnProperty("request")) throw new apiResponse.Api400Error("Required request property in body !");

      const { productID, variationID, variations } = request;

      if (!productID) throw new apiResponse.Api400Error("Required product id !");

      let model = product_variation_template_engine(variations);

      // Update variation
      if (formType === 'update-variation' && requestFor === 'product_variations' && variationID) {

         model['_vrid'] = variationID;

         if (variationID && variationID !== "") {

            result = await Product.findOneAndUpdate(
               { _id: ObjectId(productID) },
               { $set: { 'variations.$[i]': model } },
               { arrayFilters: [{ "i._vrid": variationID }] }
            );
         }
      }

      // create new variation
      if (formType === 'new-variation') {
         let newVariationID = "vi_" + Math.random().toString(36).toLowerCase().slice(2, 18);

         model['_vrid'] = newVariationID;

         result = await Product.findOneAndUpdate(
            { _id: ObjectId(productID) },
            { $push: { variations: model } },
            { upsert: true }
         );
      }

      if (result) return res.status(200).send({
         success: true,
         statusCode: 200,
         message: (formType === 'update-variation' ? "Variation successfully updated." : "Welcome new variation added.")
      })

      throw new apiResponse.Api400Error((formType === 'update-variation' ? "Variation update failed !" : "Can't added new variation !"));

   } catch (error: any) {
      next(error);
   }
}


module.exports.productControlController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { market_place, actionType, actionFor,
         listingID, productID } = req?.body;

      if (market_place !== 'wooKart') throw new apiResponse.Api400Error("Permission denied !");

      if (!listingID || !productID) throw new apiResponse.Api400Error("Required product id and listing id !");

      let filters: any;

      if (actionFor === "status" && (["active", "inactive"].includes(actionType))) {
         filters = {
            $set: { status: actionType }
         }
      }


      if (actionFor === "save_as" && (["fulfilled", "draft"].includes(actionType))) {
         filters = {
            $set: { save_as: actionType }
         }
      }

      console.log(filters);

      if (!filters) throw new apiResponse.Api400Error("Required filter !");

      const result = await Product.findOneAndUpdate({ $and: [{ _lid: listingID }, { _id: ObjectId(productID) }] },
         filters, { upsert: true }
      );

      if (result) {
         return res.status(200).send({ success: true, statusCode: 200, message: `Request ${actionType} success.` });
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
            { "supplier.store_name": user?.store?.name },
            { save_as: "fulfilled" },
            { isVerified: true }
         ];
      } else {
         showFor = [{ status: "active" }, { save_as: "fulfilled" }];
      }

      page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;

      if (searchText) {
         filters = '';
         src = [
            { title: { $regex: searchText, $options: "i" } },
            { "supplier.store_name": { $regex: searchText, $options: "i" } },
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
            $project: {
               title: 1, slug: 1, categories: 1, pricing: 1,
               image: 1, variations: 1, brand: 1, _lid: 1,
               packaged: 1,
               save_as: 1,
               shipping: 1,
               bodyInfo: 1,
               specification: 1,
               description: 1,
               manufacturer: 1,
               supplier: 1,
               status: 1,
               totalVariation: { $cond: { if: { $isArray: "$variations" }, then: { $size: "$variations" }, else: 0 } }
            }
         },
         {
            $skip: page * parseInt(item)
         }, {
            $limit: (parseInt(item))
         }
      ]);

      draftProducts = await Product.aggregate([
         {
            $match: {
               $and: [{ save_as: "draft" }, { "supplier.store_name": user?.store?.name }]
            }
         },
         {
            $project: {
               title: 1, slug: 1, categories: 1, pricing: 1,
               images: 1, variations: 1, brand: 1, _lid: 1,
               packaged: 1,
               save_as: 1,
               shipping: 1,
               bodyInfo: 1,
               specification: 1,
               description: 1,
               manufacturer: 1,
               supplier: 1,
               totalVariation: { $cond: { if: { $isArray: "$variations" }, then: { $size: "$variations" }, else: 0 } }
            }
         },
         {
            $skip: page * parseInt(item)
         }, {
            $limit: (parseInt(item))
         }
      ]);

      inactiveProduct = await Product.aggregate([
         { $unwind: { path: "$variations" } },
         {
            $match: {
               $and: [
                  { save_as: 'fulfilled' },
                  user?.role === 'SELLER' && { "supplier.store_name": user?.store?.name },
                  { status: 'inactive' }
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
               $match: { 'variations._vrid': variationID }
            }
         ]);
         product = product[0];

      } else {
         product = await Product.findOne({
            $and: [{ _id: ObjectId(productID) }, { "supplier.store_name": storeName }],
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

      const { _lid, formTypes } = req.params;

      const body = req.body;

      let model;

      const user = await User.findOne({ $and: [{ email: authEmail }, { role: 'SELLER' }] });

      if (!user) {
         return res
            .status(401)
            .send({ success: false, statusCode: 401, error: "Unauthorized" });
      }

      if (formTypes === "update" && _lid) {

         model = product_listing_template_engine(body, {
            email: authEmail,
            id: user?._uuid,
            store_name: user?.store?.name
         });

         model['modifiedAt'] = new Date(Date.now());

         const result = await Product.findOneAndUpdate(
            { _lid: _lid },
            { $set: model },
            { upsert: true }
         );

         if (!result) throw new apiResponse.Api400Error("Sorry, Product not found !");

         return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Product updated successfully.",
         })

      }

      if (formTypes === 'create') {
         model = product_listing_template_engine(body, {
            email: authEmail,
            id: user?._uuid,
            store_name: user?.store?.name
         });

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
      const _vrid = req.params.vId;
      const storeName = req.params.storeName;

      const product = await Product.findOne({ $and: [{ _id: ObjectId(productID) }, { "supplier.store_name": storeName }] });

      if (!product) {
         return res.status(404).send({ success: false, statusCode: 404, error: 'Sorry! Product not found!!!' });
      }

      if (product && Array.isArray(product?.variations) && product?.variations.length <= 1) {
         return res.status(200).send({ success: false, statusCode: 200, message: "Please create another variation before delete this variation !" });
      }

      const result = await Product.updateOne(
         { $and: [{ _id: ObjectId(productID) }, { "supplier.store_name": storeName }] },
         { $pull: { variations: { _vrid } } }
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
      const { productID, storeName, listingID } = req.params

      //return --> "acknowledged" : true, "deletedCount" : 1
      const deletedProduct = await Product.deleteOne({
         $and: [
            { _id: ObjectId(productID) },
            { _lid: listingID },
            { 'supplier.store_name': storeName }
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

      const product = await Product.findOne({ $and: [{ _id: ObjectId(productID) }, { _lid: listingID }, { "supplier.store_name": storeName }] });


      if (!product) {
         return res.status(200).send({ success: false, statusCode: 200, message: "Product Not found !" });
      }

      const result = await Product.updateOne(
         {
            $and:
               [
                  { _id: ObjectId(productID) }, { _lid: listingID }, { "supplier.store_name": storeName }
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





module.exports.updateProductData = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const urlParams = req.params.paramsType;
      let setFilter: any;

      const { listingID, productID, actionType, pricing, shipping, packageInfo, manufacturer } = req.body;

      if (!productID) throw new apiResponse.Api400Error("Required product ID !");

      if (!listingID) throw new apiResponse.Api400Error("Required listing ID !");

      if (!actionType) throw new apiResponse.Api400Error("Required actionType !");

      if (actionType === "PRICING" && urlParams === "pricing") {

         if (!pricing) throw new apiResponse.Api400Error("Required pricing !");

         const { price, sellingPrice } = pricing;
         let discount: any = 0;

         if (!price && price === "") throw new apiResponse.Api400Error("Required price identifier !");

         if (!sellingPrice && sellingPrice === "") throw new Error("Required selling price identifier !");

         discount = (parseInt(price) - parseInt(sellingPrice)) / parseInt(price);
         discount = discount * 100;
         discount = parseInt(discount);

         setFilter = {
            $set: {
               "pricing.price": parseInt(price),
               "pricing.sellingPrice": parseInt(sellingPrice),
               "pricing.discount": discount
            }
         }
      }

      if (actionType === "SHIPPING-INFORMATION" && urlParams === "shipping-information") {

         if (!shipping) throw new Error("Required shipping information !");

         const { fulfilledBy, procurementType, procurementSLA, provider } = shipping && shipping;

         if (procurementType === "" || fulfilledBy === "" || procurementSLA === "" || provider === "") throw new Error("Required fulfilledBy, procurementType, procurementSLA");

         setFilter = {
            $set: { shipping: shipping }
         }
      }

      if (actionType === "PACKAGE-DIMENSION" && urlParams === "packaged-dimension") {

         if (!packageInfo) throw new Error("Required packaged information about product");

         const { packageWeight, packageLength, packageWidth, packageHeight, inTheBox } = packageInfo && packageInfo;

         let volumetricWeight: any = ((parseFloat(packageHeight) * parseFloat(packageLength) * parseFloat(packageWidth)) / 5000).toFixed(1);
         volumetricWeight = parseFloat(volumetricWeight);

         let newPackage = {
            dimension: {
               height: parseFloat(packageHeight),
               length: parseFloat(packageLength),
               width: parseFloat(packageWidth)
            },
            weight: parseFloat(packageWeight),
            weightUnit: 'kg',
            dimensionUnit: 'cm',
            volumetricWeight,
            inTheBox: inTheBox
         }

         setFilter = {
            $set: { packaged: newPackage }
         }
      }

      if (actionType === "MANUFACTURER-INFORMATION" && urlParams === "manufacturer-information") {

         if (!manufacturer || typeof manufacturer !== "object") throw new Error("Required manufacturer details about product !");

         const { manufacturerOrigin, manufacturerDetails } = manufacturer && manufacturer;

         setFilter = {
            $set: {
               "manufacturer.origin": manufacturerOrigin,
               "manufacturer.details": manufacturerDetails
            }
         }
      }


      const result = await Product.findOneAndUpdate(
         { $and: [{ _lid: listingID }, { _id: ObjectId(productID) }] },
         setFilter,
         { upsert: true }
      );

      return result ? res.status(200).send({ success: true, statusCode: 200, message: urlParams + " updated successfully." })
         : next({ message: "Failed to updated!" });

   } catch (error: any) {
      next(error);
   }
}



module.exports.queueProductsController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { storeName } = req.params;
      const { email } = req.decoded;

      if (!storeName) throw new apiResponse.Api400Error("Required store name as a parameter !");

      const queueProduct = await QueueProduct.find({ $and: [{ "supplier.email": email }, { "supplier.store_name": storeName }] }) || [];

      let countQueue = queueProduct.length || 0;

      if (!Array.isArray(queueProduct)) throw new apiResponse.Api400Error("Queue is empty !");

      return res.status(200).send({ success: true, statusCode: 200, data: { queue: queueProduct, countQueue } });

   } catch (error: any) {
      next(error);
   }
}