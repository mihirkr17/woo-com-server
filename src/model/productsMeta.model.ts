import { Schema, model } from "mongoose";

const productsMeta = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  description: { type: String },
  specification: { type: Object },
  metaDescription: { type: String },
});


module.exports = model("ProductsMeta", productsMeta, "productsMeta");