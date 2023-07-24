import { Schema, model } from "mongoose";


const ShoppingCart = model("ShoppingCart", new Schema({
   customerEmail: { type: String, required: true },
   items: { type: Array }
}), "shoppingCarts");

module.exports = ShoppingCart;