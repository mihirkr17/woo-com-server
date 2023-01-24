var conn = require("../utils/db");
var mongodb = require("mongodb");

module.exports.productCounter = async (sellerInfo: any) => {
   try {
      let db = await conn.dbConnection();

      const productCollection = await db.collection('products');

      async function cps(saveAs: String = "") {
         let f;
         let isSaveAs;

         if (saveAs) {
            isSaveAs = { 'save_as': saveAs };
         } else {
            isSaveAs = {};
         }

         if (sellerInfo) {
            f = {
               $and: [
                  isSaveAs,
                  { 'sellerData.storeName': sellerInfo?.storeName },
                  { 'sellerData.sellerId': sellerInfo?._UUID }
               ]
            }
         } else {
            f = isSaveAs;

         }
         return productCollection.countDocuments(f);
      }

      let totalProducts: Number = await cps();

      let productInFulfilled: Number = await cps("fulfilled");

      let productInDraft: Number = await cps("draft");

      return { totalProducts, productInFulfilled, productInDraft };

   } catch (error: any) {
      return error;
   }
}

module.exports.productByCategories = async (product: any, limit: Number = 1000) => {

   try {

      let db = await conn.dbConnection();
      let relatedProducts = await db.collection('products').aggregate([
         {
            $match: {
               $and: [
                  { categories: { $in: product.categories } },
                  { slug: { $ne: product.slug } },
                  { status: "active" },
                  { save_as: 'fulfilled' }
               ]
            }
         },
         { $project: { slug: "$slug", title: "$title", pricing: "$pricing", ratingAverage: "$ratingAverage", brand: "$brand" } },
         { $limit: limit }
      ]).toArray();

   } catch (error: any) {

   }
}

// top selling products
module.exports.topSellingProducts = async () => {
   try {
      let db = await conn.dbConnection();

      return await db.collection("products").aggregate([
         { $unwind: { path: '$variations' } },
         { $match: { 'variations.status': "active" } },
         { $sort: { 'variations.totalSold': -1 } },
         { $limit: 6 }
      ]).toArray();

   } catch (error: any) {
      return error?.message;
   }
}

// top rated products
module.exports.topRatedProducts = async () => {
   try {
      const db = await conn.dbConnection();

      return await db.collection("products").aggregate([
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
               _lId: 1,
               reviews: 1
            }
         },
         { $sort: { ratingAverage: -1 } },
         { $limit: 6 }
      ]).toArray();

   } catch (error: any) {
      return error?.message;
   }
};

// Fetch all products
module.exports.allProducts = async (limits: any) => {
   try {

      const db = await conn.dbConnection();

      return await db.collection('products').aggregate([
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
               _lId: 1,
               reviews: 1
            }
         },
         { $sort: { 'variations._vId': -1 } },
         { $limit: limits }
      ]).toArray();

   } catch (error: any) {
      return error?.message;
   }
}