"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
var ProductSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true },
    categories: [
        {
            _id: false,
            name: String,
        },
    ],
    brand: { type: String, required: true },
    manufacturer: {
        origin: { type: String, required: true },
        details: { type: String, required: true },
    },
    packaged: { type: Object, required: true },
    shipping: {
        fulfilledBy: { type: String, required: true },
        procurementSLA: { type: String, required: true },
        isFree: { type: Boolean },
    },
    rating: {
        "1": Number,
        "2": Number,
        "3": Number,
        "4": Number,
        "5": Number,
    },
    ratingAverage: { type: Number, required: true, default: 0 },
    ratingsTotal: { type: Number },
    keywords: { type: Array, required: true },
    metaDescription: { type: String, required: true },
    highlights: { type: Array, required: false },
    specification: { type: Object, required: true },
    description: { type: String, required: true },
    productType: { type: String, enum: ["single", "variant"], default: "single" },
    supplierId: { type: mongoose_1.Schema.Types.ObjectId, ref: "SUPPLIER_TBL" },
    warranty: {
        type: { type: String, required: false },
        duration: { type: String, required: false },
        details: { type: String, required: false },
    },
    status: {
        type: String,
        required: true,
        enum: ["Active", "Queue", "Draft"],
        default: "Queue",
    },
    views: { type: Number },
    score: { type: Number },
    sales: { type: Number },
    createdAt: { type: Date, required: true },
    modifiedAt: { type: Date, required: false },
    isVerified: { type: Boolean, required: false },
    verifiedBy: { type: String },
    verifiedAt: { type: Date, required: false },
});
const Product = (0, mongoose_1.model)("PRODUCT_TBL", ProductSchema, "PRODUCT_TBL");
module.exports = Product;
