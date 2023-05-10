
// product.controller.tsx

import { NextFunction, Request, Response } from "express";
const Product = require("../../model/product.model");
const { findUserByEmail, calculateShippingCost } = require("../../services/common.service");
const { product_detail_pipe, product_detail_relate_pipe, home_store_product_pipe, search_product_pipe, single_purchase_pipe, ctg_filter_product_pipe, ctg_main_product_pipe } = require("../../utils/pipelines");
const NodeCache = require("node-cache");

const Caches = new NodeCache({ stdTTL: 600 });

/**
 * @controller      --> Fetch the single product information in product details page.
 * @required        --> [req.headers.authorization:email, req.query:productID, req.query:variationID, req.params:product slug]
 * @request_method  --> GET
 */
module.exports.fetchSingleProductController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { pId: productID, vId: variationID } = req.query;

      let productDetail: any;

      // Product Details
      let cacheData = Caches.get(`${productID}_${variationID}`);

      if (cacheData) {
         productDetail = JSON.parse(cacheData);

      } else {

         productDetail = await Product.aggregate(product_detail_pipe(productID, variationID));

         productDetail = productDetail[0];

         Caches.set(`${productID}_${variationID}`, JSON.stringify(productDetail), 60000);
      }


      // Related products
      const relatedProducts = await Product.aggregate(product_detail_relate_pipe(variationID, productDetail?.categories));

      return res.status(200).send({
         success: true,
         statusCode: 200,
         data: { product: productDetail, relatedProducts },
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

      const { categories } = req.query;
      const { brand, sorted, price_range } = req.body;


      let newBrand = brand && brand.split("~");

      let category: String[] =
         (categories && categories.toString().split(",")) || [];

      let sorting = {};

      if (sorted === "lowest") {
         sorting = { $sort: { "pricing.sellingPrice": 1 } };
      } else if (sorted === "highest") {
         sorting = { $sort: { "pricing.sellingPrice": -1 } }
      } else {
         sorting = { $sort: { "variations.modifiedAt": 1 } }
      }

      let filterByBrand = newBrand ? { brand: { $in: newBrand } } : {}

      let filterByPriceRange = price_range ? {
         "pricing.sellingPrice": { $lte: parseInt(price_range) }
      } : {}

      const filterData = await Product.aggregate(ctg_filter_product_pipe(category)) || [];

      const products = await Product.aggregate(ctg_main_product_pipe(category, filterByBrand, filterByPriceRange, sorting)) || [];

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

      const seller: any = req.query.seller;

      let filterQuery: any = {
         status: "active",
      };
      if (seller) {
         filterQuery['SELLER'] = seller;
      }

      const result = await Product.find(filterQuery).sort({ "stockInfo.sold": -1 }).limit(6).toArray();

      return res.status(200).send(result);

   } catch (error: any) {
      next(error);
   }
};




module.exports.purchaseProductController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const authEmail = req.decoded.email;

      let user = await findUserByEmail(authEmail);

      const { listingID, variationID, quantity, productID, customerEmail } = req?.body;

      let defaultShippingAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
         user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

      let areaType = defaultShippingAddress?.area_type;

      let product = await Product.aggregate(single_purchase_pipe(productID, listingID, variationID, quantity));

      if (product && typeof product !== 'undefined') {
         product = product[0];
         product["customerEmail"] = customerEmail;

         if (product?.shipping?.isFree && product?.shipping?.isFree) {
            product["shippingCharge"] = 0;
         } else {
            product["shippingCharge"] = calculateShippingCost((product?.packaged?.volumetricWeight * product?.quantity), areaType);
         }

         return res.status(200).send({
            success: true, statusCode: 200, data: {
               module: {
                  product,
                  container_p: {
                     baseAmounts: parseInt(product?.baseAmount),
                     totalQuantities: product?.quantity,
                     finalAmounts: (parseInt(product?.baseAmount) + product?.shippingCharge),
                     shippingFees: product?.shippingCharge,
                     savingAmounts: product?.savingAmount
                  },
                  numberOfProducts: product.length || 0
               }
            }
         });
      }
   } catch (error: any) {
      next(error)
   }
}