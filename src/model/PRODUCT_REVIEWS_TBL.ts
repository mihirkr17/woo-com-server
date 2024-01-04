import { Schema, model } from "mongoose";

module.exports = model(
  "PRODUCT_REVIEWS_TBL",
  new Schema({
    title: { type: String },
    body: { type: String },
    productId: { type: Schema.Types.ObjectId, ref: "PRODUCT_TBL" },
    customerId: { type: Schema.Types.ObjectId, ref: "CUSTOMER_TBL" },
    rating: { type: Number, required: [true, "Required rating point!"] },
    verifiedPurchase: { type: Boolean },
    reviewCountry: { type: String },
    date: { type: Date, default: Date.now() },
  }), "PRODUCT_REVIEWS_TBL"
);
