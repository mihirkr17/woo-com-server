import { Schema, model } from "mongoose";

interface IShoppingCart {
   customerEmail: string;
   productId: string;
   variationId: string;
   listingId: string;
   quantity: number;
   addedAt: Date;
}

var ShoppingCart = model<IShoppingCart>("ShoppingCart", new Schema<IShoppingCart>({
   customerEmail: { type: String, required: true },
   productId: { type: String, required: true },
   variationId: { type: String, required: true },
   listingId: { type: String, required: true },
   quantity: { type: Number },
   addedAt: { type: Date, default: Date.now() }
}), "shoppingCarts");
module.exports = ShoppingCart;