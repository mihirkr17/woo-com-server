
// product.controller.tsx

import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const Product = require("../../model/product.model");
const { findUserByEmail, getSellerInformationByID, actualSellingPrice, newPricing, basicProductProject, calculateShippingCost } = require("../../services/common.service");

/**
 * @controller      --> Fetch the single product information in product details page.
 * @required        --> [req.headers.authorization:email, req.query:productID, req.query:variationID, req.params:product slug]
 * @request_method  --> GET
 */
module.exports.fetchSingleProductController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const productID = req.query?.pId;
      const variationID = req.query?.vId;

      // Product Details
      let productDetail = await Product.aggregate([
         { $match: { _id: ObjectId(productID) } },
         {
            $addFields: {
               swatch: {
                  $map: {
                     input: {
                        $filter: {
                           input: "$variations",
                           cond: {
                              $eq: ["$$v.status", "active"]
                           },
                           as: "v"
                        }
                     },
                     as: "variation",
                     in: { variant: "$$variation.variant", _vrid: "$$variation._vrid" }
                  }
               }
            }
         },
         { $unwind: { path: '$variations' } },
         { $match: { 'variations._vrid': variationID } },
         {
            $project: {
               title: '$variations.vTitle',
               slug: 1,
               variations: 1,
               swatch: 1,
               fulfilledBy: "$shipping.fulfilledBy",
               specification: 1,
               brand: 1, categories: 1,
               sellerData: 1,
               images: 1,
               rating: 1,
               ratingAverage: 1,
               save_as: 1,
               createdAt: 1,
               bodyInfo: 1,
               description: 1,
               manufacturer: 1,
               pricing: newPricing,
               isFreeShipping: "$shipping.isFree",
               volumetricWeight: "$packaged.volumetricWeight",
               _lid: 1
            }
         }
      ]);

      productDetail = productDetail[0];

      if (productDetail?.sellerData?.sellerID) {
         productDetail["sellerInfo"] = await getSellerInformationByID(productDetail?.sellerData?.sellerID);
      }


      // Related products
      const relatedProducts = await Product.aggregate([
         { $unwind: { path: '$variations' } },
         {
            $match: {
               $and: [
                  { categories: { $in: productDetail.categories } },
                  { "variations._vrid": { $ne: variationID } },
                  { "variations.status": "active" },
               ],
            },
         },
         { $project: basicProductProject },
         { $limit: 5 },
      ]);

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

      const filterData = await Product.aggregate([
         {
            $match: { categories: { $all: category } }
         },
         {
            $addFields: {
               variations: {
                  $slice: [{
                     $filter: {
                        input: "$variations",
                        cond: { $and: [{ $eq: ["$$v.status", 'active'] }, { $eq: ["$$v.stock", "in"] }] },
                        as: "v"
                     }
                  }, 1]
               },
            },
         },
         { $unwind: { path: "$variations" } },
         {
            $project: {
               _id: 0,
               brand: 1,
               variant: "$variations.variant"
            }
         }
      ]) || [];

      const products = await Product.aggregate([
         { $match: { categories: { $all: category } } },
         {
            $addFields: {
               variations: {
                  $slice: [{
                     $filter: {
                        input: "$variations",
                        cond: { $and: [{ $eq: ["$$v.status", 'active'] }, { $eq: ["$$v.stock", "in"] }] },
                        as: "v"
                     }
                  }, 1]
               },
            }
         },
         { $unwind: { path: '$variations' } },
         { $match: filterByBrand },
         { $project: basicProductProject },
         { $match: filterByPriceRange },
         sorting
      ]) || [];

      return products ? res.status(200).send({ products, filterData })
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

      const result = (await Product.aggregate([
         { $unwind: { path: "$variations" } },
         {
            $match: {
               $and: [{ 'variations.status': "active" }, { save_as: "fulfilled" }],
               $or: [
                  { title: { $regex: q, $options: "i" } },
                  { "sellerData.storeName": { $regex: q, $options: "i" } },
                  { brand: { $regex: q, $options: "i" } },
                  { categories: { $in: [q] } },
               ],
            },
         },
         {
            $project: {
               title: "$variations.vTitle",
               categories: 1,
               _vrid: "$variations._vrid",
               image: { $first: "$images" },
               slug: 1,
               _lid: 1
            },
         },
      ])) || [];

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

      const products = await Product.aggregate([
         { $match: { save_as: 'fulfilled' } },
         {
            $addFields: {
               variations: {
                  $slice: [{
                     $filter: {
                        input: "$variations",
                        cond: { $eq: ["$$v.status", 'active'] },
                        as: "v"
                     }
                  }, 1]
               },
            }
         },
         { $unwind: { path: "$variations" } },
         { $project: basicProductProject },
         { $sort: { "variations._vrid": -1 } },
         { $limit: totalLimits }
      ]);

      const topSellingProduct = await Product.aggregate([
         { $unwind: { path: '$variations' } },
         { $match: { 'variations.status': "active" } },
         { $sort: { 'variations.totalSold': -1 } },
         { $limit: 6 }
      ]);

      const topRatedProduct = await Product.aggregate([
         { $addFields: { variations: { $first: "$variations" } } },
         { $match: { 'variations.status': 'active' } },
         { $project: basicProductProject },
         { $sort: { ratingAverage: -1 } },
         { $limit: 6 }
      ]);

      return res.status(200).send({
         success: true, statusCode: 200, data: {
            store: products,
            topSellingProducts: topSellingProduct,
            topRatedProducts: topRatedProduct
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
      const body = req.body;

      let user = await findUserByEmail(authEmail);

      let defaultShippingAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
         user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

      let areaType = defaultShippingAddress?.area_type;

      let product = await Product.aggregate([
         { $match: { _lid: body?.listingID } },
         { $unwind: { path: "$variations" } },
         { $match: { $and: [{ 'variations._vrid': body?.variationID }, { 'variations.stock': "in" }, { 'variations.status': "active" }] } },
         {
            $project: {
               _id: 0,
               title: "$variations.vTitle",
               slug: 1,
               variations: 1,
               brand: 1,
               packaged: 1,
               image: { $first: "$images" },
               sku: "$variations.sku",
               sellerData: 1,
               shipping: 1,
               savingAmount: { $multiply: [{ $subtract: ["$pricing.price", actualSellingPrice] }, parseInt(body?.quantity)] },
               baseAmount: { $multiply: [actualSellingPrice, body?.quantity] },
               sellingPrice: actualSellingPrice,
               variant: "$variations.variant",
               available: "$variations.available",
               stock: "$variations.stock"
            }
         }, {
            $unset: ["variations"]
         }
      ]);

      if (product && typeof product !== 'undefined') {
         product = product[0];
         product["quantity"] = body?.quantity;
         product["productID"] = body.productID;
         product["listingID"] = body?.listingID;
         product["variationID"] = body?.variationID;
         product["customerEmail"] = body?.customerEmail;

         if (product?.shipping?.isFree && product?.shipping?.isFree) {
            product["shippingCharge"] = 0;
         } else {
            product["shippingCharge"] = calculateShippingCost(product?.packaged?.volumetricWeight, areaType);
         }

         const baseAmounts = product?.baseAmount && parseInt(product?.baseAmount);
         const totalQuantities = product?.quantity && parseInt(product?.quantity);
         const shippingFees = product?.shippingCharge && parseInt(product?.shippingCharge);
         const finalAmounts = product && (parseInt(product?.baseAmount) + product?.shippingCharge);
         const savingAmounts = product && (parseInt(product?.savingAmount));

         let buyingCartData = {
            product: product,
            container_p: {
               baseAmounts,
               totalQuantities,
               finalAmounts,
               shippingFees,
               savingAmounts
            },
            numberOfProducts: product.length || 0
         }

         return res.status(200).send({ success: true, statusCode: 200, data: { module: buyingCartData } });
      }
   } catch (error: any) {
      next(error)
   }
}