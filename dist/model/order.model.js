"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
;
var orderSchemaList = new mongoose_1.Schema({
    orderID: String,
    listingID: String,
    variationID: String,
    productID: String,
    customerEmail: String,
    customerID: String,
    title: String,
    slug: String,
    image: String,
    brand: String,
    totalAmount: Number,
    quantity: Number,
    paymentMode: String,
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
    orderStatus: { type: String, enum: ["pending", "placed", "shipped", "canceled", "dispatch"], default: "pending" },
    cancelReason: String,
    orderCanceledAT: Object,
    orderDispatchAT: Object,
    isDispatch: { type: Boolean, required: false }
}, { _id: false });
let orderSchema = new mongoose_1.Schema({
    user_email: { type: String },
    orders: { type: orderSchemaList }
});
const Order = (0, mongoose_1.model)("Order", orderSchema, "orders");
module.exports = Order;
