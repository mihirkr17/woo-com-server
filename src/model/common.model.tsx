var conn = require("../utils/db");
var mongodb = require("mongodb");
const mng = require("mongodb");
const User = require("./user.model");

module.exports.productCounter = async (sellerInfo: any) => {
   try {
      let db = await conn.dbConnection();

      const productCollection = await db.collection('products');

      async function cps(saveAs: string = "") {
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
                  { 'sellerData.sellerID': sellerInfo?._UUID }
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

      const setData = await User.updateOne({ $and: [{ _UUID: sellerInfo?._UUID }, { role: 'SELLER' }] }, {
         $set: {
            "seller.storeInfos.numOfProduct": totalProducts,
            "seller.storeInfos.productInFulfilled": productInFulfilled,
            "seller.storeInfos.productInDraft": productInDraft
         }
      }, {});

      if (setData) return true;

   } catch (error: any) {
      return error;
   }
}


module.exports.findUserByEmail = async (email: string) => {
   try {
      return await User.countDocuments({ email }) || false;
   } catch (error: any) {
      return error;
   }
}


module.exports.checkProductAvailability = async (productID: string, variationID: String) => {
   const db = await conn.dbConnection();

   let product = await db.collection('products').aggregate([
      { $match: { _id: mng.ObjectId(productID) } },
      { $unwind: { path: "$variations" } },
      {
         $project: {
            _VID: "$variations._VID",
            available: "$variations.available",
            stock: "$variations.stock"
         }
      },
      { $match: { $and: [{ _VID: variationID }, { available: { $gte: 1 } }, { stock: 'in' }] } }
   ]).toArray();

   product = product[0];

   return product;
};

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
               _LID: 1,
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
         { $match: { save_as: 'fulfilled' } },
         {
            $project: {
               title: 1,
               slug: 1,
               variations: {
                  $slice: [{
                     $filter: {
                        input: "$variations",
                        cond: {
                           $eq: ["$$v.status", 'active']
                        },
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
         { $limit: limits }
      ]).toArray();

   } catch (error: any) {
      return error;
   }
}