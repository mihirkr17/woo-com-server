var conn = require("../utils/db");
var mongodb = require("mongodb");

module.exports.productCounter = async (seller: any = '') => {
   try {
      let db = await conn.dbConnection();
      let filter: any;

      if (seller) {
         filter = { $and: [{ status: "active" }, { 'seller.name': seller }, { save_as: 'fulfilled' }] };
      } else {
         filter = { $and: [{ status: 'active' }, { save_as: 'fulfilled' }] };
      }

      const totalProducts = await db.collection('products').countDocuments(filter);

      if (!totalProducts && typeof totalProducts !== 'number') {
         return false;
      }

      return totalProducts;

   } catch (error: any) {
      return error.message
   }
}

module.exports.productCounterAndSetter = async (user: any) => {
   try {
      let db = await conn.dbConnection();

      let totalProducts: Number = await db.collection('products').countDocuments({ $and: [{ 'seller.name': user.username }, { 'seller.uuid': mongodb.ObjectId(user._id) }] });

      if (!totalProducts && typeof totalProducts !== 'number') {
         return false;
      }

      const updateSellerInventor = await db.collection('users').updateOne(
         { $and: [{ email: user.email }, { role: user.role }] },
         { $set: { 'inventoryInfo.totalProducts': (totalProducts || 0) } },
         { upsert: true }
      );

      return updateSellerInventor ? true : false;

   } catch (error: any) {
      return error.message
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
         { $unwind: { path: "$variations" } },
         { $match: { 'variations.status': "active" } },
         { $sort: { ratingAverage: -1 } },
         { $limit: 6 }
      ]).toArray();

   } catch (error: any) {
      return error?.message;
   }
};
