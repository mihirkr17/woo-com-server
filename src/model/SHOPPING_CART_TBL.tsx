import { Schema, model } from "mongoose";


module.exports = model("SHOPPING_CART_TBL", new Schema({
   productId: { type: Schema.Types.ObjectId, ref: 'PRODUCT_TBL' },
   customerId: { type: Schema.Types.ObjectId, ref: 'CUSTOMER_TBL' },
   sku: { type: String, required: true },
   quantity: { type: Number, default: 1 },
   supplierId: { type: Schema.Types.ObjectId, ref: "SUPPLIER_TBL", required: [true, "Required supplier id !"] },
   addedAt: { type: Date, default: Date.now() }
}), "SHOPPING_CART_TBL");