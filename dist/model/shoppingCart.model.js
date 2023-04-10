"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// interface IShoppingCart {
//    customerEmail: string;
//    productID: string;
//    variationID: string;
//    listingID: string;
//    quantity: number;
//    addedAt: Date;
// }
// var ShoppingCart = model<IShoppingCart>("ShoppingCart", new Schema<IShoppingCart>({
//    customerEmail: { type: String, required: true },
//    productID: { type: String, required: true },
//    variationID: { type: String, required: true },
//    listingID: { type: String, required: true },
//    quantity: { type: Number },
//    addedAt: { type: Date, default: Date.now() }
// }), "shoppingCarts");
const ShoppingCart = (0, mongoose_1.model)("ShoppingCart", new mongoose_1.Schema({
    customerEmail: { type: String, required: true },
    items: { type: Array }
}), "shoppingCarts");
module.exports = ShoppingCart;
