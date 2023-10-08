
// product.controller.tsx

import { NextFunction, Request, Response } from "express";
const Product = require("../../model/product.model");
const { findUserByEmail, updateProductPerform } = require("../../services/common.service");
const { calculateShippingCost, calculatePopularityScore, cartContextCalculation } = require("../../utils/common");
const { product_detail_pipe, product_detail_relate_pipe, home_store_product_pipe, search_product_pipe, single_purchase_pipe, ctg_filter_product_pipe, ctg_main_product_pipe } = require("../../utils/pipelines");
const NodeCache = require("../../utils/NodeCache");
const PrivacyPolicy = require("../../model/privacyPolicy.model");
const { Api400Error } = require("../../errors/apiResponse");
const User = require("../../model/user.model");
const { ObjectId } = require("mongodb");
const Review = require("../../model/reviews.model");
/**
 * @controller      --> Fetch the single product information in product details page.
 * @required        --> [req.headers.authorization:email, req.query:productID, req.query:sku, req.params:product slug]
 * @request_method  --> GET
 */
module.exports.fetchProductDetails = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { pId: productID, sku, oTracker } = req.query;

      if (!productID || typeof productID !== "string") throw new Api400Error("Invalid product id ");

      if (!sku || typeof sku !== "string") throw new Api400Error("Invalid sku");

      let productDetail: any;

      // Product Details
      let cacheData = NodeCache.getCache(`${productID}_${sku}`);

      if (cacheData) {
         productDetail = cacheData;

      } else {

         productDetail = await Product.aggregate(product_detail_pipe(productID, sku)).allowDiskUse(true);

         productDetail = productDetail[0];


         if (oTracker) {
            await updateProductPerform({
               _id: productID,
               sku: sku,
               views: productDetail?.views || 0,
               ratingAverage: productDetail?.ratingAverage || 0,
               sales: productDetail?.sales || 0
            }, "views");
         }

         // productDetail["policies"] = await PrivacyPolicy.findOne({}) ?? {};

         NodeCache.saveCache(`${productID}_${sku}`, productDetail);
      }

      // Related products
      const relatedProducts = await Product.aggregate(product_detail_relate_pipe(sku, productDetail?.categories));

      // all success
      return res.status(200).send({
         success: true,
         statusCode: 200,
         data: { product: productDetail || {}, relatedProducts: relatedProducts || [], }
      });

   } catch (error: any) {
      next(error);
   }
};


/**
 * @controller      --> productsByCategoryController
 * @required        --> categories [Optional -> filters query]
 */
module.exports.productsByCategoryController = async (req: Request, res: Response, next: any) => {
   try {


      const { price_range, queries: qq } = req.body;

      const { brand, ctg, sorted, filters } = qq;

      const queries: any = [];

      if (brand) {
         queries.push({ brand: { $regex: new RegExp(brand?.split(",").join('|'), 'i') } });
      }

      if (ctg) {
         queries.push({ categories: { $all: ctg } });
      }


      let filterOption = {};

      if (queries.length >= 1) {
         filterOption = { $and: queries }
      }

      let sorting = {};

      if (sorted === "lowest") {
         sorting = { $sort: { "pricing.sellingPrice": 1 } };
      } else if (sorted === "highest") {
         sorting = { $sort: { "pricing.sellingPrice": -1 } }
      } else {
         sorting = { $sort: { score: 1 } }
      }




      const filterData = await Product.aggregate(ctg_filter_product_pipe(ctg)) || [];

      const products = await Product.aggregate(ctg_main_product_pipe(filterOption, sorting)) || [];


      return products ? res.status(200).send({ success: true, statusCode: 200, products, filterData })
         : res.status(404).send({
            success: false,
            statusCode: 404,
            message: "Products not available.",
         });
   } catch (error: any) {
      next(error);
   }
};




module.exports.searchProducts = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const q = req.params.q;

      if (!q || q === "") {
         return res.status(200).send([]);
      }

      const result = (await Product.aggregate(search_product_pipe(q))) || [];

      return result && res.status(200).send(result);
   } catch (error: any) {
      next(error);
   }
};


/**
 * @controller      --> Home store controller.
 * @required        --> []
 * @request_method  --> GET
 */
module.exports.homeStoreController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const totalLimits = parseInt(req.params.limits);

      const products = await Product.aggregate(home_store_product_pipe(totalLimits));

      return res.status(200).send({
         success: true, statusCode: 200, data: {
            store: products,
            topSellingProducts: null,
            topRatedProducts: null
         }
      });


   } catch (error: any) {
      next(error);
   }
}



module.exports.fetchTopSellingProduct = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const sid: any = req.query.sid;

      let filterQuery: any = {
         status: "Active",
      };
      if (sid) {
         filterQuery['supplierId'] = ObjectId(sid);
      }

      const result = await Product.find(filterQuery).sort({ sales: -1 }).limit(6).toArray();

      return res.status(200).send(result);

   } catch (error: any) {
      next(error);
   }
};




module.exports.purchaseProductController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { email, _id } = req.decoded;

      let user = await findUserByEmail(email);

      const { sku, quantity, productId } = req?.body;

      let defaultShippingAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
         user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);


      let newQuantity = parseInt(quantity);

      let product = await Product.aggregate(single_purchase_pipe(productId, sku, newQuantity));

      const { amount, totalQuantity, shippingCost, finalAmount, savingAmount, discountShippingCost } = cartContextCalculation(product);

      return res.status(200).send({
         success: true, statusCode: 200, data: {
            module: {
               cartItems: product,
               cartCalculation: {
                  amount,
                  totalQuantity,
                  finalAmount,
                  shippingCost,
                  savingAmount,
                  discountShippingCost
               },
               numberOfProduct: product.length || 0,
               defaultShippingAddress
            }
         }
      });
   } catch (error: any) {
      next(error)
   }
}