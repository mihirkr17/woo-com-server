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
        required: [true, "Required shipping address!"],
    },
    state: { type: String, enum: ["CART", "SINGLE"] },
    totalAmount: { type: Number, required: [true, "Required total amount !"] },
    totalItems: { type: Number, required: [true, "Required total items!"] },
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
    supplierId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "SUPPLIER_TBL" },
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
const ORDER_TABLE = (0, mongoose_1.model)("ORDER_TBL", orderSchema, "ORDER_TBL");
const ORDER_ITEMS_TABLE = (0, mongoose_1.model)("ORDER_ITEMS_TBL", orderItemsSchema, "ORDER_ITEMS_TBL");
module.exports = { ORDER_TABLE, ORDER_ITEMS_TABLE };
