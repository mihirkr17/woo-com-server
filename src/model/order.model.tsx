import { Schema, model } from "mongoose";


interface IOrder {
   orderID: string;
   orderPaymentID: string;
   listingID: string;
   variationID: string;
   productID: string;
   customerEmail: string;
   customerID: string;
   title: string;
   slug: string;
   image: string;
   brand: string;
   baseAmount: number;
   quantity: number;
   paymentMode: string;
   shippingAddress: object;
   shippingCharge: number;
   sellerData: object;
   sellingPrice: number;
   state: string;
   sku: string;
   trackingID: string;
   isRated?: boolean;
   orderAT: object;
   orderStatus: string;
   orderPlacedAT: Date;
   orderShippedAT: Date;
   isShipped: boolean;
   cancelReason: string;
   orderCanceledAT: object;
   isCanceled: boolean;
   orderDispatchAT: object;
   isDispatch: boolean;
   orderCompletedAT: object;
   isCompleted: boolean;
   paymentIntentID?: string;
   paymentMethodID?: string;
   paymentStatus?: string;
   refund?: object;
   clientSecret?: string;
};

var orderSchemaList = new Schema<IOrder>({
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

let orderSchema = new Schema({
   user_email: { type: String },
   orders: { type: orderSchemaList }
});

const Order = model("Order", orderSchema, "orders");
module.exports = Order;