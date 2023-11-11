import { Schema, model } from "mongoose";


const ShoppingCart = model("ShoppingCart", new Schema({
   userId: { type: Schema.Types.ObjectId, ref: 'User' },
   productId: { type: Schema.Types.ObjectId, ref: 'Product' },
   customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
   sku: { type: String, required: true },
   quantity: { type: Number, default: 1 },
   brand: String,
   storeId: { type: Schema.Types.ObjectId, required: [true, "Required store id !"] },
   storeTitle: { type: String, required: [true, "Required store title!"] },
   addedAt: { type: Date }
}), "shoppingCarts");

module.exports = ShoppingCart;