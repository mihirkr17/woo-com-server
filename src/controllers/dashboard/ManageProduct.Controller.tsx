// ManageProduct.Controller.tsx

import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const { product_listing_template_engine } = require("../../templates/product.template");
const User = require("../../model/user.model");
const QueueProduct = require("../../model/queueProduct.model");
const Product = require("../../model/product.model");
const { product_variation_template_engine } = require("../../templates/product.template");
const { generateListingID } = require("../../utils/generator");
const { Api400Error, Api500Error } = require("../../errors/apiResponse");



// Controllers
module.exports.updateStockController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const storeName = req.params.storeName;

      const { productID, variations } = req?.body;

      if (!variations?.sku || !variations?.available)
         throw new Api400Error("Product sku and unit required !");


      if (productID && storeName) {
         let stock = variations?.available <= 1 ? "out" : "in";

         const result = await Product.findOneAndUpdate(
            { $and: [{ _id: ObjectId(productID) }, { 'supplier.storeName': storeName }] },
            {
               $set: {
                  "variations.$[i].available": variations?.available,
                  "variations.$[i].stock": stock,
               },
            },
            {
               arrayFilters: [{ "i.sku": variations?.sku }]
            }
         );


         if (!result) {
            throw new Api500Error("Failed to update stock quantity !!!");
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
      let result: any;

      const { productID, variations, formType } = req.body;

      let model = product_variation_template_engine(variations);

      // Update variation
      if (formType === 'update-variation') {

         result = await Product.findOneAndUpdate(
            { _id: ObjectId(productID) },
            { $set: { 'variations.$[i]': model } },
            { arrayFilters: [{ "i.sku": variations?.sku }] }
         );

      }

      // create new variation
      if (formType === 'new-variation') {
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

      throw new Api500Error((formType === 'update-variation' ? "Variation update failed !" : "Can't added new variation !"));

   } catch (error: any) {
      next(error);
   }
}


module.exports.productControlController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { market_place, actionType, actionFor,
         listingID, productID } = req?.body;

      if (market_place !== 'wooKart') throw new Api400Error("Permission denied !");

      if (!listingID || !productID) throw new Api400Error("Required product id and listing id !");

      let filters: any;

      if (actionFor === "status" && (["active", "inactive"].includes(actionType))) {
         filters = {
            $set: { status: actionType }
         }
      }


      if (!filters) throw new Api400Error("Required filter !");

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
            { "supplier.storeName": user?.store?.name },
            { isVerified: true }
         ];
      } else {
         showFor = [{ status: "active" }];
      }

      page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;

      if (searchText) {
         filters = '';
         src = [
            { title: { $regex: searchText, $options: "i" } },
            { "supplier.storeName": { $regex: searchText, $options: "i" } },
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
               title: 1, slug: 1,
               categories: 1,
               pricing: 1,
               variations: 1,
               brand: 1,
               _lid: 1,
               packaged: 1,
               status: 1,
               shipping: 1,
               keywords: 1,
               metaDescription: 1,
               specification: 1,
               description: 1,
               manufacturer: 1,
               options: 1,
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

      draftProducts = await Product.aggregate([
         {
            $match: {
               $and: [{ status: "inactive" }, { "supplier.storeName": user?.store?.name }]
            }
         },
         {
            $project: {
               title: 1, slug: 1, 
               categories: 1, pricing: 1,
               images: 1, variations: 1, brand: 1, _lid: 1,
               packaged: 1,
               status: 1,
               shipping: 1,
               keywords: 1,
               metaDescription: 1,
               options: 1,
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
                  user?.role === 'SELLER' && { "supplier.storeName": user?.store?.name },
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
* @required        --> [req.query:seller, req.query:productID, req.query:sku]
* @request_method  --> GET
*/
module.exports.getProductForSellerDSBController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const productID = req.query.pid;
      const sku = req.query.sku;
      const storeName = req.query.storeName;

      let product;

      if (!storeName && typeof storeName === 'undefined' && !productID) return res.status(204).send();

      if (sku && typeof sku === 'string') {
         product = await Product.aggregate([
            {
               $match: { _id: ObjectId(productID) }
            },
            {
               $unwind: { path: "$variations" },
            },
            {
               $match: { 'variations.sku': sku }
            }
         ]);
         product = product[0];

      } else {
         product = await Product.findOne({
            $and: [{ _id: ObjectId(productID) }, { "supplier.storeName": storeName }],
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

      const { formTypes } = req.params;

      const body = req.body;

      let model;

      const user = await User.findOne({ $and: [{ email: authEmail }, { role: 'SELLER' }] });

      if (!user) {
         return res
            .status(401)
            .send({ success: false, statusCode: 401, error: "Unauthorized" });
      }

      if (formTypes === 'create') {

         if (!body?.variation) {
            throw new Api400Error("Required variation !");
         }

         model = product_listing_template_engine(body, authEmail);

         model["rating"] = [
            { weight: 5, count: 0 },
            { weight: 4, count: 0 },
            { weight: 3, count: 0 },
            { weight: 2, count: 0 },
            { weight: 1, count: 0 },
         ];

         model["ratingAverage"] = 0;
         model['status'] = 'queue';
         model["createdAt"] = new Date();
         model["_lid"] = generateListingID();
         model["isVerified"] = false;

         let queueProduct = new Product(model);
         let results = await queueProduct.save();

         if (results) {
            return res.status(200).send({
               success: true,
               statusCode: 200,
               message: "Product created successfully. It will take upto 24 hours to on live.",
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

      const { productID, sku } = req.params;
      const { email } = req?.decoded;

      const product = await Product.findOne({ $and: [{ _id: ObjectId(productID) }, { "supplier.email": email }] });

      if (!product) {
         return res.status(404).send({ success: false, statusCode: 404, error: 'Sorry! Product not found!!!' });
      }

      if (product && Array.isArray(product?.variations) && product?.variations.length <= 1) {
         return res.status(200).send({ success: false, statusCode: 200, message: "Please create another variation before delete this variation !" });
      }

      const result = await Product.findOneAndUpdate(
         { $and: [{ _id: ObjectId(productID) }, { "supplier.email": email }] },
         { $pull: { variations: { sku } } }
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
            { 'supplier.storeName': storeName }
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

      const product = await Product.findOne({ $and: [{ _id: ObjectId(productID) }, { _lid: listingID }, { "supplier.storeName": storeName }] });


      if (!product) {
         return res.status(200).send({ success: false, statusCode: 200, message: "Product Not found !" });
      }

      const result = await Product.updateOne(
         {
            $and:
               [
                  { _id: ObjectId(productID) }, { _lid: listingID }, { "supplier.storeName": storeName }
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

      const { listingID, productID, actionType, pricing, shipping, packageInfo, manufacturer, description } = req.body;

      if (!productID) throw new Api400Error("Required product ID !");

      if (!listingID) throw new Api400Error("Required listing ID !");

      if (!actionType) throw new Api400Error("Required actionType !");

      if (actionType === "PRICING" && urlParams === "pricing") {

         if (!pricing) throw new Api400Error("Required pricing !");

         const { price, sellingPrice } = pricing;
         let discount: any = 0;

         if (!price && price === "") throw new Api400Error("Required price identifier !");

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

         if (!manufacturer || typeof manufacturer !== "object") throw new Api400Error("Required manufacturer details about product !");

         const { manufacturerOrigin, manufacturerDetails } = manufacturer && manufacturer;

         setFilter = {
            $set: {
               "manufacturer.origin": manufacturerOrigin,
               "manufacturer.details": manufacturerDetails
            }
         }
      }

      if (actionType === "DESCRIPTION-INFORMATION" && urlParams === "description") {
         setFilter = {
            $set: {
               description
            }
         }
      }


      const result = await Product.findOneAndUpdate(
         { $and: [{ _lid: listingID }, { _id: ObjectId(productID) }] },
         setFilter,
         { upsert: true }
      );

      if (!result) throw new Api500Error("Failed to updated!");

      return res.status(200).send({ success: true, statusCode: 200, message: urlParams + " updated successfully." })
   } catch (error: any) {
      next(error);
   }
}



module.exports.queueProductsController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { storeName } = req.params;
      const { email } = req.decoded;

      if (!storeName) throw new Api400Error("Required store name as a parameter !");

      const queueProduct = await QueueProduct.find({ $and: [{ "supplier.email": email }, { "supplier.storeName": storeName }] }) || [];

      let countQueue = queueProduct.length || 0;

      if (!Array.isArray(queueProduct)) throw new Api400Error("Queue is empty !");

      return res.status(200).send({ success: true, statusCode: 200, data: { queue: queueProduct, countQueue } });

   } catch (error: any) {
      next(error);
   }
}