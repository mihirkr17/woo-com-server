import { Schema, model } from "mongoose";


var orderSchema = new Schema({
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

      product_id: String,

      slug: String,

      title: String,

      assets: Object,

      brand: String,

      sku: String,

      sellingPrice: Number,

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

const Order = model("Order", orderSchema, "orders");
module.exports = Order;