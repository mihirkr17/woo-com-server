// common.services.tsx
const mdb = require("mongodb");
const Product = require("../model/product.model");
const UserModel = require("../model/user.model");
const OrderModel = require("../model/order.model");

// Services
module.exports.updateProductVariationAvailability = async (
   productID: string,
   variationID: string,
   quantity: number,
   action: string
) => {

   const product = await Product.findOne({
      _id: mdb.ObjectId(productID)
   });

   if (product) {
      const targetVariation = product?.variations.filter((v: any) => v?._VID === variationID)[0];
      let available = targetVariation?.available;
      let restAvailable;

      if (action === "inc") {
         restAvailable = available + quantity;
      }
      if (action === "dec") {
         restAvailable = available - quantity;
      }

      let stock = restAvailable <= 1 ? "out" : "in";

      const result = await Product.updateOne({ _id: mdb.ObjectId(productID) }, {
         $set: {
            "variations.$[i].available": restAvailable,
            "variations.$[i].stock": stock
         }
      }, {
         arrayFilters: [{ 'i._VID': variationID }]
      });
   }
};


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
      const { customerEmail, type, orderID, trackingID, cancelReason } = obj;

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