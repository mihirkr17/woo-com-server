// common.services.tsx
const mdb = require("mongodb");
const Product = require("../model/product.model");
const UserModel = require("../model/user.model");
const OrderModel = require("../model/order.model");
const db = require("mongodb");


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

module.exports.order_status_updater = async (obj: any) => {
   try {
      const { customerEmail, type, orderID, trackingID, cancelReason, refundAT } = obj;

      let setQuery: any;
      const timestamp = Date.now();

      let timePlan = {
         iso: new Date(timestamp),
         time: new Date(timestamp).toLocaleTimeString(),
         date: new Date(timestamp).toDateString(),
         timestamp: timestamp
      };

      if (type === "dispatch") {
         setQuery = {
            $set: {
               "orders.$[i].orderStatus": "dispatch",
               "orders.$[i].orderDispatchAT": timePlan,
               "orders.$[i].isDispatch": true
            }
         }
      } else if (type === "shipped") {
         setQuery = {
            $set: {
               "orders.$[i].orderStatus": "shipped",
               "orders.$[i].orderShippedAT": timePlan,
               "orders.$[i].isShipped": true
            }
         }
      } else if (type === "completed") {
         setQuery = {
            $set: {
               "orders.$[i].orderStatus": "completed",
               "orders.$[i].orderCompletedAT": timePlan,
               "orders.$[i].isCompleted": true
            }
         }
      } else if (type === "canceled" && cancelReason) {
         setQuery = {
            $set: {
               "orders.$[i].orderStatus": "canceled",
               "orders.$[i].cancelReason": cancelReason,
               "orders.$[i].orderCanceledAT": timePlan,
               "orders.$[i].isCanceled": true
            }
         }
      } else if (type === "refunded" && refundAT) {
         setQuery = {
            $set: {
               "orders.$[i].refund.isRefunded": true,
               "orders.$[i].refund.refundAT": refundAT,
               "orders.$[i].orderStatus": "refunded"
            }
         }
      }

      return await OrderModel.findOneAndUpdate(
         { user_email: customerEmail },
         setQuery,
         {
            arrayFilters: [{ "i.orderID": orderID, "i.trackingID": trackingID }],
         }
      ) ? { success: true } : { success: false };
   } catch (error: any) {
      return error?.message;
   }
}


module.exports.get_product_variation = async (data: any) => {
   try {

      let variation = await Product.aggregate([
         { $match: { $and: [{ _LID: data?.listingID }, { _id: db.ObjectId(data?.productID) }] } },
         { $unwind: { path: "$variations" } },
         { $project: { variations: 1 } },
         { $match: { $and: [{ "variations._VID": data?.variationID }] } },
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
         { $match: { $and: [{ _LID: listingID }, { _id: db.ObjectId(productID) }] } },
         { $unwind: { path: "$variations" } },
         { $project: { variations: 1 } },
         { $match: { $and: [{ "variations._VID": variationID }] } },
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
         { $and: [{ _id: db.ObjectId(productID) }, { _LID: listingID }] },
         {
            $set: {
               "variations.$[i].available": available,
               "variations.$[i].stock": stock
            }
         },
         { arrayFilters: [{ "i._VID": variationID }] }
      ) || null;
   } catch (error: any) {
      return error?.message;
   }
}


module.exports.getSellerInformationByID = async (uuid: string) => {
   try {
      let result = await UserModel.aggregate([
         { $match: { _UUID: uuid } },
         {
            $project: {
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


module.exports.actualSellingPrice = { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] }


module.exports.newPricing = {
   sellingPrice: { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] },
   price: "$pricing.price",
   discount: {
      $toInt: {
         $multiply: [
            {
               $divide: [
                  { $subtract: ["$pricing.price", { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] }] },
                  "$pricing.price"
               ]
            }, 100]
      }
   }
}

module.exports.basicProductProject = {
   title: "$variations.vTitle",
   slug: 1,
   brand: 1,
   packageInfo: 1,
   rating: 1,
   ratingAverage: 1,
   _LID: 1,
   reviews: 1,
   image: { $first: "$images" },
   _VID: "$variations._VID",
   stock: "$variations.stock",
   pricing: {
      sellingPrice: { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] },
      price: "$pricing.price",
      discount: { $toInt: { $multiply: [{ $divide: [{ $subtract: ["$pricing.price", { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] }] }, "$pricing.price"] }, 100] } }
   }
}



module.exports.calculateShippingCost = (volWeight: number, areaType: string) => {
   let n = 0; // price initial 0.5 kg = 0.5 dollar
   let charge: any;
   let arr = [];

   if (volWeight <= 3) {
      charge = areaType === "local" ? 0.5 : areaType === "zonal" ? 0.8 : 0.8;
   }
   else if (volWeight > 3 && volWeight <= 8) {
      charge = areaType === "local" ? 0.4 : areaType === "zonal" ? 0.7 : 0.7;
   }
   else if (volWeight > 8) {
      charge = areaType === "local" ? 0.3 : areaType === "zonal" ? 0.5 : 0.5;
   }

   do {
      n += 0.5;
      arr.push(n);
   } while (n < volWeight);

   let count = arr.length;

   let sum = (count * charge).toFixed(0);
   return parseInt(sum);
}