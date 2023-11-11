"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ShoppingCart = (0, mongoose_1.model)("ShoppingCart", new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer' },
    sku: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    brand: String,
    storeId: { type: mongoose_1.Schema.Types.ObjectId, required: [true, "Required store id !"] },
    storeTitle: { type: String, required: [true, "Required store title!"] },
    addedAt: { type: Date }
}), "shoppingCarts");
module.exports = ShoppingCart;
