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
    sellerData: Object,
    variant: Object,
    sellingPrice: Number,
    state: String,
    trackingID: String,
    orderAT: Object,
    orderPlacedAT: { type: Date, required: false },
    orderShippedAT: { type: Date, required: false },
    isShipped: Boolean,
    orderStatus: { type: String, enum: ["pending", "placed", "shipped", "canceled", "dispatch", "refunded", "completed"], default: "pending" },
    cancelReason: String,
    orderCanceledAT: Object,
    isCanceled: Boolean,
    orderDispatchAT: Object,
    isDispatch: { type: Boolean, required: false },
    orderCompletedAT: { type: Date, required: false },
    isCompleted: Boolean,
    paymentIntentID: { type: String, required: false },
    paymentMethodID: { type: String, required: false },
    paymentStatus: { type: String, required: false, enum: ["success", "failed", "pending"] },
    refund: { type: Object, required: false }
}, { _id: false });
let orderSchema = new mongoose_1.Schema({
    user_email: { type: String },
    orders: { type: orderSchemaList }
});
const Order = (0, mongoose_1.model)("Order", orderSchema, "orders");
module.exports = Order;
