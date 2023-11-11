"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const productsMeta = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product" },
    description: { type: String },
    specification: { type: Object },
    metaDescription: { type: String },
});
module.exports = (0, mongoose_1.model)("ProductsMeta", productsMeta, "productsMeta");
