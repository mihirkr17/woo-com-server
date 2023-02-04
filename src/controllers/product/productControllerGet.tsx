import { NextFunction, Request, Response } from "express";
var { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const {
   topSellingProducts,
   topRatedProducts,
   allProducts
} = require("../../model/product.model");

/**
 * @controller      --> Fetch the single product information in product details page.
 * @required        --> [req.headers.authorization:email, req.query:productId, req.query:variationId, req.params:product slug]
 * @request_method  --> GET
 */
module.exports.fetchSingleProductController = async (req: Request, res: Response, next: any) => {
   try {
      const db = await dbConnection();

      const email: String = req.headers.authorization || '';
      const product_slug: String = req.params.product_slug;
      const productId = req.query?.pId;
      const variationId = req.query.vId;
      let existProductInCart: any = null;
      let existProductInWishlist: any;

      // If user email address exists
      if (email && typeof email === 'string') {
         existProductInCart = await db
            .collection("shoppingCarts")
            .findOne({ $and: [{ customerEmail: email }, { variationId: variationId }] });

         existProductInWishlist = await db
            .collection("users")
            .findOne({ $and: [{ email }, { "wishlist.slug": product_slug }] });
      }

      // Product Details
      let productDetail = await db.collection('products').aggregate([
         { $match: { _id: ObjectId(productId) } },
         {
            $project: {
               title: 1,
               slug: 1,
               variations: 1,
               swatch: {
                  $map: {
                     input: "$variations",
                     as: "variation",
                     in: { variant: "$$variation.variant", _vId: "$$variation._vId" }
                  }
               },
               fulfilledBy: "$shipping.fulfilledBy",
               deliveryCharge: "$shipping.delivery",
               deliveryDetails: 1,
               specification: '$specification',
               brand: 1, categories: 1,
               sellerData: 1, rating: 1, ratingAverage: 1, save_as: 1, createdAt: 1, bodyInfo: 1, manufacturer: 1,
               _lId: 1,
               inCart: {
                  $cond: {
                     if: { $eq: [existProductInCart, null] }, then: false, else: true
                  }
               }
            }
         },
         { $unwind: { path: '$variations' } },
         { $match: { 'variations._vId': variationId } }
      ]).toArray();


      productDetail = productDetail[0];

      // Related products
      const relatedProducts = await db.collection("products").aggregate([
         { $unwind: { path: '$variations' } },
         {
            $match: {
               $and: [
                  { categories: { $in: productDetail.categories } },
                  { 'variations._vId': { $ne: variationId } },
                  { 'variations.status': "active" },
               ],
            },
         },
         {
            $project: {
               _lId: 1,
               title: 1,
               slug: 1,
               ratingAverage: "$ratingAverage",
               brand: "$brand",
               variations: {
                  _vId: "$variations._vId",
                  pricing: "$variations.pricing",
                  attributes: "$variations.attributes",
                  images: "$variations.images"
               },
               reviews: 1,
            },
         },
         { $limit: 5 },
      ]).toArray();



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
      const db = await dbConnection();

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


      const products = await db.collection("products").aggregate([
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
               title: 1, slug: 1, variations: 1, rating: 1, brand: 1, _lId: 1, _id: 1,
               ratingAverage: 1
            }
         },
         sorting
      ]).toArray();

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
      const db = await dbConnection();

      const q = req.params.q;

      const result =
         (await db
            .collection("products")
            .aggregate([
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
module.exports.homeStoreController = async (req: Request, res: Response) => {
   try {
      const totalLimits = parseInt(req.params.limits);

      const products = await allProducts(totalLimits);

      const topSellingProduct = await topSellingProducts();

      const topRatedProduct = await topRatedProducts();

      return res.status(200).send({
         success: true, statusCode: 200, data: {
            store: products,
            topSellingProducts: topSellingProduct,
            topRatedProducts: topRatedProduct
         }
      });


   } catch (error: any) {
      return res.status(500).send({ success: false, statusCode: 500, error: error?.message });
   }
}



module.exports.fetchTopSellingProduct = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const seller: any = req.query.seller;
      let filterQuery: any = {
         status: "active",
      };
      if (seller) {
         filterQuery['SELLER'] = seller;
      }

      const result = await db
         .collection("products")
         .find(filterQuery)
         .sort({ "stockInfo.sold": -1 })
         .limit(6)
         .toArray();
      res.status(200).send(result);
   } catch (error: any) {
      return res.status(500).send({ message: error?.message });
   }
};