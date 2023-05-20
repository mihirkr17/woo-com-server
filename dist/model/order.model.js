"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
;
var orderSchemaList = new mongoose_1.Schema({
    orderID: String,
    orderPaymentID: String,
    listingID: String,
    variationID: String,
    productID: String,
    customerEmail: String,
    customerID: String,
    title: String,
    slug: String,
    image: String,
    brand: String,
    baseAmount: Number,
    quantity: Number,
    paymentMode: String,
    sku: String,
    shippingAddress: Object,
    shippingCharge: Number,
    supplier: Object,
    sellingPrice: Number,
    state: String,
    trackingID: String,
    orderStatus: { type: String, enum: ["pending", "placed", "shipped", "canceled", "dispatch", "refunded", "completed"], default: "pending" },
    cancelReason: String,
    paymentIntentID: { type: String, required: false },
    paymentMethodID: { type: String, required: false },
    paymentStatus: { type: String, required: false, enum: ["success", "failed", "pending"] },
    refund: { type: Object, required: false },
    clientSecret: { type: String, required: false, default: undefined },
    orderAT: Object,
    orderPlacedAT: { type: Date, required: false },
    orderShippedAT: { type: Date, required: false },
    orderCompletedAT: { type: Date, required: false },
    orderCanceledAT: Object,
    orderDispatchAT: Object,
    isRated: { type: Boolean, required: false },
    isCanceled: Boolean,
    isCompleted: Boolean,
    isShipped: Boolean,
    isDispatch: { type: Boolean, required: false },
}, { _id: false });
let orderSchema = new mongoose_1.Schema({
    user_email: { type: String },
    orders: { type: orderSchemaList }
});
const Order = (0, mongoose_1.model)("Order", orderSchema, "orders");
module.exports = Order;
