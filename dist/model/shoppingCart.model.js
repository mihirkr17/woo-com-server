"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ShoppingCart = (0, mongoose_1.model)("ShoppingCart", new mongoose_1.Schema({
    customerEmail: { type: String, required: true },
    items: { type: Array }
}), "shoppingCarts");
module.exports = ShoppingCart;
