"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
var orderSchema = new mongoose_1.Schema({
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "CUSTOMER_TBL",
    },
    customerContactEmail: {
        type: String,
        required: [true, "Required contact email!"],
    },
    shippingAddress: {
        type: Object,
        required: true,
    },
    state: { type: String, enum: ["CART", "SINGLE"] },
    totalAmount: { type: Number, required: true },
    orderStatus: {
        type: String,
        enum: ["placed", "shipped", "canceled", "refunded", "delivered"],
        default: "placed",
    },
    paymentMode: { type: String, required: false, enum: ["card", "cod"] },
    paymentIntentId: { type: String, required: false },
    paymentStatus: {
        type: String,
        required: false,
        enum: ["paid", "unpaid", "pending", "cod"],
    },
    refund: { type: Object, required: false },
    orderPlacedAt: { type: Date, default: new Date(Date.now()) },
});
const orderItemsSchema = new mongoose_1.Schema({
    orderId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "ORDER_TBL" },
    trackingId: { type: String },
    productId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    storeId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "STORE_TBL" },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "CUSTOMER_TBL" },
    supplierEmail: { type: String, required: false },
    storeTitle: { type: String, required: true },
    title: { type: String, required: true },
    image: Object,
    sku: { type: String, required: true },
    sellPrice: { type: Number, required: true },
    amount: { type: Number, required: true },
    quantity: { type: Number, required: true },
    status: Array,
    isRated: { type: Boolean, required: false },
    placedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    canceledAt: Date,
    cancelReason: String,
});
const Order = (0, mongoose_1.model)("ORDER_TBL", orderSchema, "ORDER_TBL");
const OrderItems = (0, mongoose_1.model)("ORDER_ITEMS_TBL", orderItemsSchema, "ORDER_ITEMS_TBL");
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
//
// Main Order Table
const ORDER_TABLE_SCHEMA = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "CUSTOMER_TBL" },
    customerContactEmail: {
        type: String,
        required: [true, "Required customer contact email!"],
    },
    shippingAddress: Object,
    storeId: { type: mongoose_1.Schema.Types.ObjectId, ref: "STORE_TBL" },
    storeTitle: String,
    status: Array,
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"] },
    paymentMode: { type: String, enum: ["cod", "card"] },
    orderPlacedAt: { type: Date, default: new Date(Date.now()) },
});
// order items schema
const ORDER_ITEM_TABLE_SCHEMA = new mongoose_1.Schema({
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "ORDER_TBL",
        required: [true, "Required order id!"],
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "PRODUCT_TBL",
        required: [true, "Required product id!"],
    },
    title: String,
    sku: { type: String, required: [true, "Required product sku!"] },
    image: { type: Object },
    sellPrice: { type: Number, required: [true, "Required sell price!"] },
    amount: { type: Number, required: [true, "Required total item amount!"] },
    quantity: { type: Number, required: [true, "Required item quantity!"] },
    initialStatus: {
        type: String,
        enum: ["pending", "placed", "shipped", "delivered", "canceled"],
    },
    isRated: Boolean,
});
// const ORDER_TABLE = model("ORDER_TBL", ORDER_TABLE_SCHEMA, "ORDER_TBL");
// const ORDER_ITEM_TABLE = model(
//   "ORDER_ITEMS_TBL",
//   ORDER_ITEM_TABLE_SCHEMA,
//   "ORDER_ITEMS_TBL"
// );
// module.exports = { ORDER_TABLE, ORDER_ITEM_TABLE };
