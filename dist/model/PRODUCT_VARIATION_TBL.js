"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const variation = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product" },
    vTitle: String,
    image: Object,
    stockPrice: Number,
    sellPrice: Number,
    discount: Number,
    sku: String,
    attributes: Object,
    stockQuantity: Number,
    stock: String,
});
module.exports = (0, mongoose_1.model)("PRODUCT_VARIATION_TBL", variation, "PRODUCT_VARIATION_TBL");
