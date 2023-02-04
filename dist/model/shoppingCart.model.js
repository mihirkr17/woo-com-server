"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
var ShoppingCart = (0, mongoose_1.model)("ShoppingCart", new mongoose_1.Schema({
    customerEmail: { type: String, required: true },
    productId: { type: String, required: true },
    variationId: { type: String, required: true },
    listingId: { type: String, required: true },
    quantity: { type: Number },
    addedAt: { type: Date, default: Date.now() }
}), "shoppingCarts");
module.exports = ShoppingCart;
