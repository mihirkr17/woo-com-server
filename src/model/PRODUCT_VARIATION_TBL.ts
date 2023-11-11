import { Schema, model } from "mongoose";

const variation = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  vTitle: String,
  image: Object,
  stockPrice: Number,
  sellPrice: Number,
  discount: Number,
  sku: String,
  attributes: Object,
  stockQuantity: Number,
  stock: String,
});

module.exports = model(
  "PRODUCT_VARIATION_TBL",
  variation,
  "PRODUCT_VARIATION_TBL"
);
