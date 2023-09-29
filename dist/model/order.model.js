"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
var orderSchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    shippingAddress: { type: Object, required: true },
    state: { type: String },
    items: [{
            _id: false,
            trackingId: { type: String },
            productId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
            itemId: { type: Number, required: true },
            supplierId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
            supplierEmail: { type: String, required: true },
            storeName: { type: String, required: true },
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
        }],
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
var splitOrderSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    shippingAddress: { type: Object, required: true },
    state: { type: String },
    trackingId: { type: String },
    productId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    supplierId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    imageUrl: String,
    brand: { type: String, required: true },
    sku: { type: String, required: true },
    sellingPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true },
    orderStatus: {
        type: String,
        enum: ["placed", "shipped", "canceled", "dispatch", "refunded", "completed"],
        default: 'placed'
    },
    paymentMode: { type: String, required: false, enum: ["card", "cod"] },
    paymentStatus: { type: String, required: false, enum: ["paid", "unpaid", "pending"], default: "pending" },
    paymentMethodId: { type: String, required: false },
    paymentIntentId: { type: String, required: true },
    cancelReason: String,
    refund: { type: Object, required: false },
    orderPlacedAt: Date,
    orderShippedAt: Date,
    orderCompletedAt: Date,
    orderCanceledAt: Date,
    orderDispatchedAt: Date,
    isRated: { type: Boolean, required: false },
    isRefunded: Boolean
});
module.exports = (0, mongoose_1.model)("Order", orderSchema, "orders");
