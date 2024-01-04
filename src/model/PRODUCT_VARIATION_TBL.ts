import { Schema, model } from "mongoose";

module.exports = model(
  "PRODUCT_VARIATION_TBL",
  new Schema({
    productId: { type: Schema.Types.ObjectId, ref: "PRODUCT_TBL" },
    title: String,
    images: [
      {
        _id: false,
        link: String,
        variant: String,
      },
    ],
    mainImage: String,
    stockPrice: Number,
    sellPrice: Number,
    discount: Number,
    sku: String,
    attributes: Object,
    stockQuantity: Number,
    stock: String,
    status: {type: String, enum: ["on", "off"]}
  }),
  "PRODUCT_VARIATION_TBL"
);
