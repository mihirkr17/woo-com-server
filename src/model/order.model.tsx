import { Schema, model } from "mongoose";


interface IOrder {
   orderID: string,
   listingID: string,
   variationID: string,
   productID: string,
   customerEmail: string,
   customerID: string,
   title: string,
   slug: string,
   image: string,
   brand: string,
   totalAmount: number,
   quantity: number,
   paymentMode: string,
   shippingAddress: object,
   shippingCharge: number,
   sellerData: object,
   variant: object,
   sellingPrice: number,
   state: string,
   trackingID: string,
   orderAT: object,
   orderStatus: string,
   orderPlacedAT: Date,
   orderShippedAT: Date,
   cancelReason: string,
   orderCanceledAT: object,
   orderDispatchAT: object,
   isDispatch: boolean
};

var orderSchemaList = new Schema<IOrder>({
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

let orderSchema = new Schema({
   user_email: { type: String },
   orders: { type: orderSchemaList }
});

const Order = model<IOrder>("Order", orderSchema, "orders");
module.exports = Order;