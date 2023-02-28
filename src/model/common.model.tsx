var conn = require("../utils/db");
var mongodb = require("mongodb");
const mng = require("mongodb");
const User = require("./user.model");
const ProductTable = require("./product.model");

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