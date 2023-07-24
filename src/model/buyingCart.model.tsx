import { Schema, model } from "mongoose";

interface IBuyingCart {
   customerEmail: string;
   productID: string;
   sku: string;
   listingID: string;
   quantity: number;
   addedAt: Date;
}

var BuyingCart = model<IBuyingCart>("BuyingCart", new Schema<IBuyingCart>({
   customerEmail: { type: String, required: true },
   productID: { type: String, required: true },
   sku: { type: String, required: true },
   listingID: { type: String, required: true },
   quantity: { type: Number },
   addedAt: { type: Date, default: Date.now() }
}), "buyingCarts");
module.exports = BuyingCart;