// ManageProduct.Controller.tsx

import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const { product_listing_template_engine } = require("../../templates/product.template");
const Supplier = require("../../model/supplier.model");
const Product = require("../../model/product.model");
const { product_variation_template_engine } = require("../../templates/product.template");
const { generateListingID } = require("../../utils/generator");
const { Api400Error, Api500Error, Api403Error, Api404Error } = require("../../errors/apiResponse");
import { IProductVariationStockUpdate, IUpdateProductStatusController } from "../../interfaces/product.interface";


module.exports.allProductsBySupplier = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const authEmail = req.decoded.email;
      const role = req.decoded.role;

      let { p_search, p_category, p_status } = req?.query;

      const user = await Supplier.findOne({ $and: [{ email: authEmail }, { role }] });

      let item: any;
      let page: any;
      item = req.query.items;
      page = req.query.page;
      let products: any;

      let showFor: any[] = [];


      if (user.role === 'SUPPLIER') {
         showFor = [
            { "supplier.storeName": user?.storeName },
            { "supplier.email": user?.email }
         ];
      }

      page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;

      const queries: any = [];

      if (p_search) {
         queries.push({ title: { $regex: p_search, $options: "i" } });
      }

      if (p_status) {
         queries.push({ status: { $regex: p_status, $options: "i" } });
      }

      if (p_category) {
         queries.push({ categories: { categories: { $in: [p_category] } } });
      }


      let filters = {};

      if (queries.length >= 1) {
         filters = { $and: queries }
      }

      products = await Product.aggregate([
         {
            $match: {
               $and: showFor,
            }
         },

         {
            $addFields: {
               totalVariation: { $cond: { if: { $isArray: "$variations" }, then: { $size: "$variations" }, else: 0 } }
            }
         },
         {
            $match: filters
         },
         {
            $project: {
               title: 1,
               slug: 1,
               categories: 1,
               variations: 1,
               brand: 1,
               _lid: 1,
               status: 1,
               supplier: 1,
               createdAt: 1,
               modifiedAt: 1,
               isVerified: 1,
               totalVariation: 1
            }
         },
         {
            $skip: page * parseInt(item)
         }, {
            $limit: (parseInt(item))
         }
      ]);

      const totalCount = await Product.countDocuments({ $and: showFor });

      return res.status(200).send({
         success: true,
         statusCode: 200,
         data: { products, totalCount },
      });
   } catch (error: any) {
      next(error);
   }
};

module.exports.fetchSingleProduct = async (req: Request, res: Response, next: NextFunction) => {

   try {
      const { productId } = req?.params;

      const data = await Product.findOne({ _id: ObjectId(productId) });

      return res.status(200).send({ success: true, statusCode: 200, data });
   } catch (error: any) {
      next(error);
   }
}

module.exports.updateProductStatusController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const status = ["Active", "Draft"];

      const { productId, statusValue }: IUpdateProductStatusController = req?.body;

      if (!productId) throw new Api400Error("Required product id !");

      if (!ObjectId.isValid(productId)) throw new Api400Error("Invalid product id !");

      if (!status.includes(statusValue)) throw new Api400Error("Invalid status action !");

      await Product.findOneAndUpdate({ _id: ObjectId(productId) }, { status: statusValue });

      return res.status(200).send({ success: true, statusCode: 200, message: `Status updated to "${statusValue}"` });
   } catch (error: any) {
      next(error);
   }
}

// Product listing
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

      const supplier = await Supplier.findOne({ $and: [{ email: authEmail }, { role: 'SUPPLIER' }] });

      if (!supplier) throw new Api403Error("Forbidden !");

      if (formTypes === 'create') {

         if (!body?.variation) {
            throw new Api400Error("Required variation !");
         }

         model = product_listing_template_engine(body, { storeName: supplier?.storeName, storeId: supplier?._id });

         model["rating"] = [
            { weight: 5, count: 0 },
            { weight: 4, count: 0 },
            { weight: 3, count: 0 },
            { weight: 2, count: 0 },
            { weight: 1, count: 0 },
         ];

         model["ratingAverage"] = 0;
         model['status'] = 'Queue';
         model["createdAt"] = new Date();
         model["_lid"] = generateListingID();
         model["isVerified"] = false;

         let product = new Product(model);
         let results = await product.save();

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

// product variation controller
module.exports.productVariationController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      let result: any;

      const { productId, variation, formType } = req.body;

      if (!ObjectId.isValid(productId)) throw new Api400Error("Invalid product id !");

      let model = product_variation_template_engine(variation);

      // Update variation
      if (formType === 'update-variation') {

         result = await Product.findOneAndUpdate(
            { _id: ObjectId(productId) },
            { $set: { 'variations.$[i]': model } },
            { arrayFilters: [{ "i.sku": variation?.sku }] }
         );

      }

      // create new variation
      if (formType === 'new-variation') {
         result = await Product.findOneAndUpdate(
            { _id: ObjectId(productId) },
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

module.exports.productDeleteController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { productId, storeName } = req.params as { productId: string, storeName: string };
      const { _id } = req?.decoded;


      if (!ObjectId.isValid(productId)) throw new Api400Error("Invalid product id !");
      if (!ObjectId.isValid(_id)) throw new Api400Error("Invalid supplier id !");


      //return --> "acknowledged" : true, "deletedCount" : 1
      const result = await Product.deleteOne({
         $and: [
            { _id: ObjectId(productId) },
            { 'supplier.storeName': storeName },
            { 'supplier.storeId': ObjectId(_id) }
         ]
      });

      if (!result.deletedCount)
         throw new Api500Error("Internal Server Error !");


      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: "Product deleted successfully.",
      });
   } catch (error: any) {
      next(error);
   }
};

// delete product variation controller
module.exports.productVariationDeleteController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { productId, productSku, storeName } = req.params as { productId: string, productSku: string, storeName: string };
      const { _id } = req?.decoded as { email: string, _id: string };

      const product = await Product.findOne({
         $and: [
            { _id: ObjectId(productId) },
            { "supplier.storeId": ObjectId(_id) },
            { "supplier.storeName": storeName }]
      });

      if (!product)
         throw new Api404Error("Sorry! Product not found!!!");

      // Validate that productSku corresponds to an actual variation
      const variationToDelete = product?.variations.find((variation: any) => variation?.sku === productSku);

      if (!variationToDelete)
         throw new Api404Error("Variation not found");


      if (Array.isArray(product?.variations) && product?.variations.length <= 1)
         throw new Api400Error("Please create another variation before delete this variation !")

      product.variations = product?.variations.filter((variation: any) => variation?.sku !== productSku);


      await product.save();

      return res.status(200).send({ success: true, statusCode: 200, message: 'Variation deleted successfully.' });
   } catch (error: any) {
      next(error);
   }
}

module.exports.productUpdateController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const urlParams = req.params.paramsType;
      const { _id } = req?.decoded as { _id: string }
      let filters: any = {};

      const { productId, actionType, shipping, packageInfo, manufacturer, description } = req.body;

      if (!productId) throw new Api400Error("Required product ID !");

      if (!actionType) throw new Api400Error("Required actionType !");

      if (actionType === "SHIPPING-INFORMATION" && urlParams === "shipping-information") {

         if (!shipping) throw new Error("Required shipping information !");

         const { fulfilledBy, procurementType, procurementSLA, provider } = shipping && shipping;

         if (procurementType === "" || fulfilledBy === "" || procurementSLA === "" || provider === "") throw new Error("Required fulfilledBy, procurementType, procurementSLA");

         filters = {
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

         filters = {
            $set: { packaged: newPackage }
         }
      }

      if (actionType === "MANUFACTURER-INFORMATION" && urlParams === "manufacturer-information") {

         if (!manufacturer || typeof manufacturer !== "object") throw new Api400Error("Required manufacturer details about product !");

         const { manufacturerOrigin, manufacturerDetails } = manufacturer && manufacturer;

         filters = {
            $set: {
               "manufacturer.origin": manufacturerOrigin,
               "manufacturer.details": manufacturerDetails
            }
         }
      }

      if (actionType === "DESCRIPTION-INFORMATION" && urlParams === "description") {
         filters = {
            $set: {
               description
            }
         }
      }


      const result = await Product.findOneAndUpdate(
         { $and: [{ "supplier.storeId": ObjectId(_id) }, { _id: ObjectId(productId) }] },
         filters,
         { upsert: true }
      );

      if (!result) throw new Api500Error("Failed to updated!");

      return res.status(200).send({ success: true, statusCode: 200, message: urlParams + " updated successfully." })
   } catch (error: any) {
      next(error);
   }
}

module.exports.productStockUpdateController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { storeName } = req.params as { storeName: string };

      const { productId, variation } = req?.body as { productId: string, variation: IProductVariationStockUpdate };

      if (!variation?.sku || !variation?.available)
         throw new Api400Error("Product sku and unit required !");


      if (!ObjectId.isValid(productId)) throw new Api400Error("Invalid product id !");

      let stock = variation?.available <= 1 ? "out" : "in";

      const result = await Product.findOneAndUpdate(
         { $and: [{ _id: ObjectId(productId) }, { 'supplier.storeName': storeName }] },
         {
            $set: {
               "variations.$[i].available": variation?.available,
               "variations.$[i].stock": stock,
            },
         },
         {
            arrayFilters: [{ "i.sku": variation?.sku }]
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

   } catch (error: any) {
      next(error);
   }
};
