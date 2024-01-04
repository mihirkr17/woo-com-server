"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
module.exports = (0, mongoose_1.model)("PRODUCT_REVIEWS_TBL", new mongoose_1.Schema({
    title: { type: String },
    body: { type: String },
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "PRODUCT_TBL" },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "CUSTOMER_TBL" },
    rating: { type: Number, required: [true, "Required rating point!"] },
    verifiedPurchase: { type: Boolean },
    reviewCountry: { type: String },
    date: { type: Date, default: Date.now() },
}), "PRODUCT_REVIEWS_TBL");
