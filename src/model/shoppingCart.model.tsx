import { Schema, model } from "mongoose";


const ShoppingCart = model("ShoppingCart", new Schema({

   productId: { type: Schema.Types.ObjectId, ref: 'Product' },
   customerId: { type: Schema.Types.ObjectId, ref: 'User' },
   sku: { type: String, required: true },
   quantity: { type: Number, default: 1 },
   addedAt: { type: Date }
}), "shoppingCarts");

module.exports = ShoppingCart;