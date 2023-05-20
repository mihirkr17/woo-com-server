import { Schema, model } from "mongoose";

const orderTab = new Schema({
   orderID: { type: String, required: true },

   trackingID: { type: String, default: undefined },

   orderPaymentID: String,

   customerEmail: { type: String, required: true },

   customerID: { type: String, required: true },

   seller: {
      email: { type: String, required: true },
      store: { type: String, required: true }
   },

   shippingAddress: { type: Object, required: true },

   state: { type: String, enum: ["byCart", "byPurchase"], required: true },

   areaType: { type: String, required: true },

   totalAmount: { type: Number, required: true },

   paymentMode: { type: String, required: true },

   orderAT: { type: Object, required: true },

   paymentIntentID: { type: String, required: false },

   paymentMethodID: { type: String, required: false },

   clientSecret: { type: String, required: false, default: undefined },

   orderStatus: {
      type: String,
      enum: ["placed", "shipped", "canceled", "dispatch", "refunded", "completed"],
      default: 'placed'
   },

   paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
   },

   isCompleted: { type: Boolean, required: false },

   isDispatch: { type: Boolean, required: false },

   isShipped: { type: Boolean, required: false },

   isCanceled: { type: Boolean, required: false },

   orderCanceledAT: { type: Object, required: false },

   orderDispatchAT: { type: Object, required: false },

   orderCompletedAT: { type: Object, required: false },

   orderShippedAT: { type: Object, required: false },

   cancelReason: { type: String, required: false },

   refund: { type: Object, required: false },

   items: [
      {
         _id: false,
         itemID: String,
         listingID: String,
         variationID: String,
         productID: String,
         title: String,
         slug: String,
         image: String,
         brand: String,
         baseAmount: Number,
         quantity: Number,
         sku: String,
         shippingCharge: Number,
         supplier: { type: Object, required: true },
         sellingPrice: { type: Number, required: true },
         isRated: { type: Boolean, required: false },
         packaged: { type: Object, required: true },
         shipping: { type: Object, required: true }
      }
   ]
});

const OrderTable = model("order_table", orderTab, "order_table");

module.exports = OrderTable;