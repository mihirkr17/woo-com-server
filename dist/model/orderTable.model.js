"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const orderTab = new mongoose_1.Schema({
    orderID: { type: String, required: true },
    orderPaymentID: String,
    customerEmail: { type: String, required: true },
    customerID: { type: String, required: true },
    sellerEmail: { type: String, required: true },
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
        enum: ["pending", "placed", "shipped", "canceled", "dispatch", "refunded", "completed"],
        default: 'pending'
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
    orderCompletedAT: { type: Date, required: false },
    orderPlacedAT: { type: Date, required: false },
    orderShippedAT: { type: Date, required: false },
    cancelReason: { type: String, required: false },
    refund: { type: Object, required: false },
    items: [
        {
            _id: false,
            itemID: String,
            trackingID: { type: String, default: undefined },
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
            sellerData: { type: Object, required: true },
            sellingPrice: { type: Number, required: true },
            isRated: { type: Boolean, required: false },
        }
    ]
});
const OrderTable = (0, mongoose_1.model)("order_table", orderTab, "order_table");
module.exports = OrderTable;
