import { Schema, model } from "mongoose";


var orderSchema = new Schema({

   customerId: { type: Schema.Types.ObjectId, required: true },

   shippingAddress: { type: Object, required: true },

   state: { type: String, enum: ["CART", "SINGLE"] },

   trackingId: { type: String },

   totalAmount: { type: Number, required: true },

   orderStatus: {
      type: String,
      enum: ["placed", "shipped", "canceled", "dispatch", "refunded", "completed"],
      default: 'placed'
   },

   paymentMode: { type: String, required: false, enum: ["card", "cod"] },

   paymentIntentId: { type: String, required: false },

   paymentStatus: { type: String, required: false, enum: ["paid", "unpaid", "pending"] },

   refund: { type: Object, required: false },

   orderPlacedAt: Date,

   orderShippedAt: Date,

   orderCompletedAt: Date,

   orderCanceledAt: Date,

   orderDispatchedAt: Date,

   isRefunded: Boolean
});


const orderItemsSchema = new Schema({

   orderId: { type: Schema.Types.ObjectId, required: true, ref: "Order" },

   productId: { type: Schema.Types.ObjectId, required: true },

   // itemId: { type: Number, required: true },

   storeId: { type: Schema.Types.ObjectId, required: true },

   supplierEmail: { type: String, required: true },

   storeTitle: { type: String, required: true },

   title: { type: String, required: true },

   imageUrl: String,

   brand: { type: String, required: true },

   sku: { type: String, required: true },

   attributes: { type: Object },

   sellingPrice: { type: Number, required: true },

   amount: { type: Number, required: true },

   quantity: { type: Number, required: true },

   itemStatus: { type: String, enum: ["placed", "shipped", "canceled", "dispatch", "refunded", "completed"], default: "placed" },

   isRated: { type: Boolean, required: false },

   cancelReason: String,
});


const Order = model("Order", orderSchema, "orders");
const OrderItems = model("OrderItems", orderItemsSchema, "orderItems");


module.exports = { Order, OrderItems };


// items: [{

//    _id: false,

//    productId: { type: Schema.Types.ObjectId, required: true },

//    itemId: { type: Number, required: true },

//    storeId: { type: Schema.Types.ObjectId, required: true },

//    supplierEmail: { type: String, required: true },

//    storeTitle: { type: String, required: true },

//    title: { type: String, required: true },

//    imageUrl: String,

//    brand: { type: String, required: true },

//    sku: { type: String, required: true },

//    attributes: { type: Object },

//    sellingPrice: { type: Number, required: true },

//    amount: { type: Number, required: true },

//    quantity: { type: Number, required: true },

//    itemStatus: { type: String, enum: ["placed", "shipped", "canceled", "dispatch", "refunded", "completed"], default: "placed" },

//    isRated: { type: Boolean, required: false },

//    cancelReason: String,
// }],


// var splitOrderSchema = new Schema({
//    _id: { type: Schema.Types.ObjectId, required: true },

//    customerId: { type: Schema.Types.ObjectId, required: true },

//    shippingAddress: { type: Object, required: true },

//    state: { type: String },

//    trackingId: { type: String },

//    productId: { type: Schema.Types.ObjectId, required: true },

//    storeId: { type: Schema.Types.ObjectId, required: true },

//    title: { type: String, required: true },

//    imageUrl: String,

//    brand: { type: String, required: true },

//    sku: { type: String, required: true },

//    sellingPrice: { type: Number, required: true },

//    quantity: { type: Number, required: true },

//    amount: { type: Number, required: true },

//    orderStatus: {
//       type: String,
//       enum: ["placed", "shipped", "canceled", "dispatch", "refunded", "completed"],
//       default: 'placed'
//    },

//    paymentMode: { type: String, required: false, enum: ["card", "cod"] },

//    paymentStatus: { type: String, required: false, enum: ["paid", "unpaid", "pending"], default: "pending" },

//    paymentMethodId: { type: String, required: false },

//    paymentIntentId: { type: String, required: true },

//    cancelReason: String,

//    refund: { type: Object, required: false },

//    orderPlacedAt: Date,

//    orderShippedAt: Date,

//    orderCompletedAt: Date,

//    orderCanceledAt: Date,

//    orderDispatchedAt: Date,

//    isRated: { type: Boolean, required: false },

//    isRefunded: Boolean
// });