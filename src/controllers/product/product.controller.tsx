
// product.controller.tsx

import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const Product = require("../../model/product.model");
const ShoppingCart = require("../../model/shoppingCart.model");
const { findUserByEmail } = require("../../services/common.services");

/**
 * @controller      --> Fetch the single product information in product details page.
 * @required        --> [req.headers.authorization:email, req.query:productID, req.query:variationID, req.params:product slug]
 * @request_method  --> GET
 */
module.exports.fetchSingleProductController = async (req: Request, res: Response, next: any) => {
   try {

      const email: String = req.headers.authorization || '';
      const productID = req.query?.pId;
      const variationID = req.query.vId;
      let existProductInCart: any = null;
      let areaType: any;


      // If user email address exists
      if (email && typeof email === 'string') {
         existProductInCart = await ShoppingCart.findOne({ $and: [{ customerEmail: email }, { variationID: variationID }] });

         let user = await findUserByEmail(email);

         let defaultShippingAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
            user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

         areaType = defaultShippingAddress?.area_type;
      }

      // Product Details
      let productDetail = await Product.aggregate([
         { $match: { _id: ObjectId(productID) } },
         {
            $project: {
               title: 1,
               slug: 1,
               variations: 1,
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
                     in: { variant: "$$variation.variant", _VID: "$$variation._VID" }
                  }
               },
               fulfilledBy: "$shipping.fulfilledBy",
               deliveryCharge: {
                  $cond: { if: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge", else: "$shipping.delivery.zonalCharge" }
               },
               deliveryDetails: 1,
               specification: '$specification',
               brand: 1, categories: 1,
               sellerData: 1, rating: 1, ratingAverage: 1, save_as: 1, createdAt: 1, bodyInfo: 1, manufacturer: 1,
               _LID: 1,
               paymentInfo: 1,
               inCart: {
                  $cond: {
                     if: { $eq: [existProductInCart, null] }, then: false, else: true
                  }
               }
            }
         },
         { $unwind: { path: '$variations' } },
         {
            $set: {
               title: { $concat: ["$title", " ", " (", { $ifNull: ["$variations.variant.ram", ""] }, ", ", "$variations.variant.rom", ")"] }
            }
         },
         { $match: { 'variations._VID': variationID } }
      ]);


      productDetail = productDetail[0];

      // Related products
      const relatedProducts = await Product.aggregate([
         { $unwind: { path: '$variations' } },
         {
            $match: {
               $and: [
                  { categories: { $in: productDetail.categories } },
                  { 'variations._VID': { $ne: variationID } },
                  { 'variations.status': "active" },
               ],
            },
         },
         {
            $project: {
               _LID: 1,
               title: 1,
               slug: 1,
               ratingAverage: "$ratingAverage",
               brand: "$brand",
               variations: {
                  _VID: "$variations._VID",
                  pricing: "$variations.pricing",
                  variant: "$variations.variant"
               },
               reviews: 1,
            },
         },
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

      const { categories, filters } = req.query;

      let category: String[] =
         (categories && categories.toString().split(",")) || [];

      let sorting = {};

      if (filters && filters === "lowest") {
         sorting = { $sort: { "variations.pricing.sellingPrice": 1 } };
      } else if (filters && filters === "highest") {
         sorting = { $sort: { "variations.pricing.sellingPrice": -1 } }
      } else {
         sorting = { $sort: { "variations.modifiedAt": 1 } }
      }


      const products = await Product.aggregate([
         { $unwind: { path: '$variations' } },
         {
            $match: {
               $and: [
                  { categories: { $all: category } },
                  { 'variations.status': "active" }
               ]
            }
         },
         {
            $project: {
               title: 1, slug: 1, variations: 1, rating: 1, brand: 1, _LID: 1, _id: 1,
               ratingAverage: 1
            }
         },
         sorting
      ]);

      return products
         ? res.status(200).send(products)
         : res.status(404).send({
            success: false,
            statusCode: 404,
            error: "Products not available.",
         });
   } catch (error: any) {
      next(error);
   }
};




module.exports.searchProducts = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const q = req.params.q;

      const result =
         (await Product.aggregate([
            { $unwind: { path: "$variations" } },
            {
               $match: {
                  $and: [{ 'variations.status': "active" }, { save_as: "fulfilled" }],
                  $or: [
                     { title: { $regex: q, $options: "i" } },
                     { "sellerData.sellerName": { $regex: q, $options: "i" } },
                     { brand: { $regex: q, $options: "i" } },
                     { categories: { $in: [q] } },
                  ],
               },
            },
            {
               $project: {
                  title: "$title",
                  categories: "$categories",
                  images: "$variations.images",
               },
            },
         ])
            .toArray()) || [];

      return result.length > 0
         ? res.status(200).send(result)
         : res.status(204).send();
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
            $project: {
               title: 1,
               slug: 1,
               variations: {
                  $slice: [{
                     $filter: {
                        input: "$variations",
                        cond: { $and: [{ $eq: ["$$v.status", 'active'] }, { $eq: ["$$v.stock", "in"] }] },
                        as: "v"
                     }
                  }, 1]
               },
               brand: 1,
               packageInfo: 1,
               rating: 1,
               ratingAverage: 1,
               _LID: 1,
               reviews: 1
            }
         },
         { $unwind: { path: "$variations" } },
         { $sort: { 'variations._VID': -1 } },
         { $limit: totalLimits }
      ]);;

      const topSellingProduct = await Product.aggregate([
         { $unwind: { path: '$variations' } },
         { $match: { 'variations.status': "active" } },
         { $sort: { 'variations.totalSold': -1 } },
         { $limit: 6 }
      ]);

      const topRatedProduct = await Product.aggregate([
         { $addFields: { variations: { $first: "$variations" } } },
         { $match: { 'variations.status': 'active' } },
         {
            $project: {
               title: 1,
               slug: 1,
               variations: 1,
               brand: 1,
               packageInfo: 1,
               rating: 1,
               ratingAverage: 1,
               _LID: 1,
               reviews: 1
            }
         },
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

      let buyProduct = await Product.aggregate([
         { $match: { _LID: body?.listingID } },
         { $unwind: { path: "$variations" } },
         { $match: { $and: [{ 'variations._VID': body?.variationID }] } },
         {
            $project: {
               _id: 0,
               title: 1,
               slug: 1,
               variations: 1,
               brand: 1,
               image: { $first: "$variations.images" },
               sku: "$variations.sku",
               sellerData: 1,
               shippingCharge: {
                  $switch: {
                     branches: [
                        { case: { $eq: [areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                        { case: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                     ],
                     default: "$shipping.delivery.zonalCharge"
                  }
               },
               savingAmount: { $multiply: [{ $subtract: ["$variations.pricing.price", "$variations.pricing.sellingPrice"] }, parseInt(body?.quantity)] },
               baseAmount: { $multiply: ['$variations.pricing.sellingPrice', body?.quantity] },
               totalAmount: {
                  $add: [{ $multiply: ['$variations.pricing.sellingPrice', body?.quantity] }, {
                     $switch: {
                        branches: [
                           { case: { $eq: [areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                           { case: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                        ],
                        default: "$shipping.delivery.zonalCharge"
                     }
                  }]
               },
               paymentInfo: 1,
               sellingPrice: "$variations.pricing.sellingPrice",
               variant: "$variations.variant",
               stock: "$variations.stock"
            }
         }, {
            $unset: ["variations"]
         }
      ]);

      if (buyProduct && typeof buyProduct !== 'undefined') {
         buyProduct = buyProduct[0];
         buyProduct["quantity"] = body?.quantity;
         buyProduct["productID"] = body.productID;
         buyProduct["listingID"] = body?.listingID;
         buyProduct["variationID"] = body?.variationID;
         buyProduct["customerEmail"] = body?.customerEmail;

         const baseAmounts = buyProduct?.totalAmount && parseInt(buyProduct?.baseAmount);
         const totalQuantities = buyProduct?.quantity && parseInt(buyProduct?.quantity);
         const shippingFees = buyProduct?.shippingCharge && parseInt(buyProduct?.shippingCharge);
         const finalAmounts = buyProduct && (parseInt(buyProduct?.totalAmount));
         const savingAmounts = buyProduct && (parseInt(buyProduct?.savingAmount));

         let buyingCartData = {
            product: buyProduct,
            container_p: {
               baseAmounts,
               totalQuantities,
               finalAmounts,
               shippingFees,
               savingAmounts
            },
            numberOfProducts: buyProduct.length || 0
         }

         return res.status(200).send({ success: true, statusCode: 200, data: { module: buyingCartData } });
      }
   } catch (error: any) {
      next(error)
   }
}