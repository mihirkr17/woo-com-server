// common.services.tsx
const mdb = require("mongodb");
const Product = require("../model/product.model");
const UserModel = require("../model/user.model");
const OrderModel = require("../model/order.model");
const OrderTable = require("../model/orderTable.model");
const ShoppingCartModel = require("../model/shoppingCart.model");
const cryptos = require("crypto");
const apiResponse = require("../errors/apiResponse");
const { generateTrackingID } = require("../utils/generator");



module.exports.findUserByEmail = async (email: string) => {
   try {
      return await UserModel.findOne(
         { $and: [{ email: email }, { accountStatus: 'active' }] },
         {
            password: 0,
            createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
         }
      ) || null;
   } catch (error: any) {
      return error;
   }
}


module.exports.findUserByUUID = async (uuid: string) => {
   try {
      return await UserModel.findOne(
         { $and: [{ _uuid: uuid }, { accountStatus: 'active' }] },
         {
            password: 0,
            createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
         }
      ) || null;
   } catch (error: any) {
      return error;
   }
}

module.exports.order_status_updater = async (obj: any) => {
   try {
      const { customerEmail, type, orderID, cancelReason, refundAT, sellerEmail, items } = obj;

      let setQuery: any = {};
      const timestamp = Date.now();

      let timePlan = {
         iso: new Date(timestamp),
         time: new Date(timestamp).toLocaleTimeString(),
         date: new Date(timestamp).toDateString(),
         timestamp: timestamp
      };

      if (type === "dispatch") {
         // await Promise.all(items.map(async (item: any) => {

         //    return await OrderTable.findOneAndUpdate({
         //       $and: [
         //          { customerEmail }, { orderID },
         //          { "seller.email": sellerEmail }]
         //    }, {
         //       $set: {
         //          "items.$[i].trackingID": generateTrackingID()
         //       }
         //    },
         //       { arrayFilters: [{ "i.itemID": item?.itemID }], upsert: true });
         // }));

         setQuery = {
            $set: {
               orderStatus: "dispatch",
               orderDispatchAT: timePlan,
               isDispatch: true,
               trackingID: generateTrackingID()
            }
         }
      }

      else if (type === "shipped") {
         setQuery = {
            $set: {
               orderStatus: "shipped",
               orderShippedAT: timePlan,
               isShipped: true
            }
         }
      }

      else if (type === "completed") {
         setQuery = {
            $set: {
               orderStatus: "completed",
               orderCompletedAT: timePlan,
               isCompleted: true
            }
         }
      }

      else if (type === "canceled" && cancelReason) {
         setQuery = {
            $set: {
               orderStatus: "canceled",
               cancelReason: cancelReason,
               orderCanceledAT: timePlan,
               isCanceled: true
            }
         }
      }

      else if (type === "refunded" && refundAT) {
         setQuery = {
            $set: {
               isRefunded: true,
               refundAT: refundAT,
               orderStatus: "refunded"
            }
         }
      }

      return await OrderTable.findOneAndUpdate({
         $and: [
            { customerEmail }, { orderID },
            { "seller.email": sellerEmail }]
      }, setQuery,
         { upsert: true });

   } catch (error: any) {
      return error?.message;
   }
}


module.exports.get_product_variation = async (data: any) => {
   try {

      let variation = await Product.aggregate([
         { $match: { $and: [{ _lid: data?.listingID }, { _id: mdb.ObjectId(data?.productID) }] } },
         { $unwind: { path: "$variations" } },
         { $project: { variations: 1 } },
         { $match: { $and: [{ "variations._vrid": data?.variationID }] } },
         { $replaceRoot: { newRoot: { $mergeObjects: ["$variations", "$$ROOT"] } } },
         { $unset: ["variations"] }
      ]);

      if (variation) {
         return variation[0];
      }

   } catch (error: any) {
      return error;
   }
};


module.exports.update_variation_stock_available = async (type: string, data: any) => {
   try {

      let available: number = 0;

      if (!type) {
         return;
      }

      if (!data) {
         return;
      }

      const { productID, variationID, listingID, quantity } = data;

      let variation = await Product.aggregate([
         { $match: { $and: [{ _lid: listingID }, { _id: mdb.ObjectId(productID) }] } },
         { $unwind: { path: "$variations" } },
         { $project: { variations: 1 } },
         { $match: { $and: [{ "variations._vrid": variationID }] } },
         { $replaceRoot: { newRoot: { $mergeObjects: ["$variations", "$$ROOT"] } } },
         { $unset: ["variations"] }
      ]);

      variation = variation[0];

      if (type === "inc") {
         available = parseInt(variation?.available) + parseInt(quantity);
      } else if (type === "dec") {
         available = parseInt(variation?.available) - parseInt(quantity);
      }

      let stock: string = available <= 0 ? "out" : "in";

      return await Product.findOneAndUpdate(
         { $and: [{ _id: mdb.ObjectId(productID) }, { _lid: listingID }] },
         {
            $set: {
               "variations.$[i].available": available,
               "variations.$[i].stock": stock
            }
         },
         { arrayFilters: [{ "i._vrid": variationID }] }
      ) || null;
   } catch (error: any) {
      return error?.message;
   }
}


module.exports.getSellerInformationByID = async (uuid: string) => {
   try {
      let result = await UserModel.aggregate([
         { $match: { _uuid: uuid } },
         {
            $project: {
               email: 1,
               fullName: 1,
               contactEmail: 1,
               dob: 1,
               gender: 1,
               phone: 1,
               phonePrefixCode: 1,
               taxId: "$seller.taxId",
               address: "$seller.address",
               storeInfos: "$seller.storeInfos"
            }
         }
      ]);

      return result[0] || null;

   } catch (error: any) {
      return error;
   }
}


module.exports.calculateShippingCost = (volWeight: number, areaType: string = "") => {
   // let n = 0; // price initial 0.5 kg = 0.5 dollar
   let charge: any;
   // let arr = [];

   // if (volWeight <= 3) {
   //    charge = areaType === "local" ? 0.5 : areaType === "zonal" ? 0.8 : 0.8;
   // }
   // else if (volWeight > 3 && volWeight <= 8) {
   //    charge = areaType === "local" ? 0.4 : areaType === "zonal" ? 0.7 : 0.7;
   // }
   // else if (volWeight > 8) {
   //    charge = areaType === "local" ? 0.3 : areaType === "zonal" ? 0.5 : 0.5;
   // }

   // do {
   //    n += 0.5;
   //    arr.push(n);
   // } while (n < volWeight);

   // let count = arr.length;

   // let sum = (count * charge).toFixed(0);
   // return parseInt(sum);

   volWeight = Math.ceil(volWeight);

   if (volWeight <= 1) {
      charge = areaType === "local" ? 10 : areaType === "zonal" ? 15 : 15;
   } else if (volWeight > 1 && volWeight <= 5) {
      charge = areaType === "local" ? 20 : areaType === "zonal" ? 25 : 25;
   } else if (volWeight > 5 && volWeight <= 10) {
      charge = areaType === "local" ? 30 : areaType === "zonal" ? 40 : 40;
   } else if (volWeight > 10) {
      charge = areaType === "local" ? 50 : areaType === "zonal" ? 60 : 60;
   }

   return charge;
}


module.exports.is_product = async (productID: string, variationID: string) => {
   try {
      return await Product.countDocuments({
         $and: [
            { _id: mdb.ObjectId(productID) },
            { variations: { $elemMatch: { _vrid: variationID } } }
         ]
      }) || 0;
   } catch (error: any) {
      return error;
   }
}


module.exports.productCounter = async (sellerInfo: any) => {
   try {

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
                  { 'sellerData.sellerID': sellerInfo?._uuid }
               ]
            }
         } else {
            f = isSaveAs;

         }
         return await Product.countDocuments(f);
      }

      let totalProducts: Number = await cps();

      let productInFulfilled: Number = await cps("fulfilled");

      let productInDraft: Number = await cps("draft");

      const setData = await UserModel.updateOne({ $and: [{ _uuid: sellerInfo?._uuid }, { role: 'SELLER' }] }, {
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


module.exports.checkProductAvailability = async (productID: string, variationID: String) => {

   let product = await Product.aggregate([
      { $match: { _id: mdb.ObjectId(productID) } },
      { $unwind: { path: "$variations" } },
      {
         $project: {
            _vrid: "$variations._vrid",
            available: "$variations.available",
            stock: "$variations.stock"
         }
      },
      { $match: { $and: [{ _vrid: variationID }, { available: { $gte: 1 } }, { stock: 'in' }] } }
   ]);

   product = product[0];

   return product;
};


module.exports.clearCart = async (email: string) => {
   try {
      return await ShoppingCartModel.findOneAndUpdate({ customerEmail: email }, {
         $set: { items: [] }
      })
   } catch (error: any) {
      return error;
   }
}