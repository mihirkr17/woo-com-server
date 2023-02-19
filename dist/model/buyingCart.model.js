"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
var BuyingCart = (0, mongoose_1.model)("BuyingCart", new mongoose_1.Schema({
    customerEmail: { type: String, required: true },
    productID: { type: String, required: true },
    variationID: { type: String, required: true },
    listingID: { type: String, required: true },
    quantity: { type: Number },
    addedAt: { type: Date, default: Date.now() }
}), "buyingCarts");
module.exports = BuyingCart;
