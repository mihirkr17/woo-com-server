"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// interface IOrder {
//    orderID: string;
//    orderPaymentID: string;
//    listingID: string;
//    variationID: string;
//    productID: string;
//    customerEmail: string;
//    customerID: string;
//    title: string;
//    slug: string;
//    assets: object;
//    brand: string;
//    baseAmount: number;
//    quantity: number;
//    paymentMode: string;
//    shippingAddress: object;
//    shippingCharge: number;
//    supplier: object;
//    sellingPrice: number;
//    state: string;
//    sku: string;
//    trackingID: string;
//    isRated?: boolean;
//    packaged: any,
//    shipping: any,
//    orderAT: object;
//    orderStatus: string;
//    orderPlacedAT: Date;
//    orderShippedAT: Date;
//    isShipped: boolean;
//    cancelReason: string;
//    orderCanceledAT: object;
//    isCanceled: boolean;
//    orderDispatchAT: object;
//    isDispatch: boolean;
//    orderCompletedAT: object;
//    isCompleted: boolean;
//    paymentStatus?: string;
//    refund?: object;
//    payment_data?: object
// };
var orderSchema = new mongoose_1.Schema({
    order_id: String,
    customer: {
        id: { type: String, required: true },
        email: { type: String, required: true },
        shipping_address: Object
    },
    supplier: Object,
    state: String,
    tracking_id: String,
    product: {
        listing_id: String,
        variation_id: String,
        product_id: String,
        slug: String,
        title: String,
        assets: Object,
        brand: String,
        sku: String,
        selling_price: Number,
        base_amount: Number,
    },
    quantity: Number,
    shipping_charge: Number,
    final_amount: Number,
    packaged: { type: Object, required: true },
    shipping: { type: Object, required: true },
    order_status: {
        type: String,
        enum: ["placed", "shipped", "canceled", "dispatch", "refunded", "completed"],
        default: 'placed'
    },
    payment: {
        mode: { type: String, required: false, enum: ["card", "cod"] },
        client_secret: { type: String, required: false, default: undefined },
        intent_id: { type: String, required: false },
        method_id: { type: String, required: false },
        status: { type: String, required: false, enum: ["success", "failed", "pending"] },
    },
    cancel_reason: String,
    refund: { type: Object, required: false },
    order_placed_at: Object,
    order_shipped_at: Object,
    order_completed_at: Object,
    order_canceled_at: Object,
    order_dispatched_at: Object,
    is_rated: { type: Boolean, required: false },
    is_canceled: Boolean,
    is_completed: Boolean,
    is_shipped: Boolean,
    is_dispatched: { type: Boolean, required: false },
    is_refunded: Boolean
});
const Order = (0, mongoose_1.model)("Order", orderSchema, "orders");
module.exports = Order;
