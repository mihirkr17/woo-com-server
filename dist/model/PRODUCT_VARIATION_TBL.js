"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
module.exports = (0, mongoose_1.model)("PRODUCT_VARIATION_TBL", new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "PRODUCT_TBL" },
    title: String,
    images: [
        {
            _id: false,
            link: String,
            variant: String,
        },
    ],
    mainImage: String,
    stockPrice: Number,
    sellPrice: Number,
    discount: Number,
    sku: String,
    attributes: Object,
    stockQuantity: Number,
    stock: String,
    status: { type: String, enum: ["on", "off"] }
}), "PRODUCT_VARIATION_TBL");
