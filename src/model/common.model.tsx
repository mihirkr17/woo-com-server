var conn = require("../utils/db");
var mongodb = require("mongodb");
const mng = require("mongodb");
const User = require("./user.model");

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


module.exports.checkProductAvailability = async (productId: string, variationId: String) => {
   const db = await conn.dbConnection();

   let product = await db.collection('products').aggregate([
      { $match: { _id: mng.ObjectId(productId) } },
      { $unwind: { path: "$variations" } },
      {
         $project: {
            _vId: "$variations._vId",
            available: "$variations.available",
            stock: "$variations.stock"
         }
      },
      { $match: { $and: [{ _vId: variationId }, { available: { $gte: 1 } }, { stock: 'in' }] } }
   ]).toArray();

   product = product[0];

   return product;
};