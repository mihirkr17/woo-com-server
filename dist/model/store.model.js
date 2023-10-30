"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const businessTypes = [
    "Fashion and Apparel",
    "Electronics",
    "Home and Furniture",
    "Beauty and Personal Care",
    "Toys and Games",
    "Sports and Outdoors",
    "Books and Media",
    "Handmade and Crafts",
    "Health and Wellness",
    "Automotive",
    "Food and Grocery",
];
const storeSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    storeName: { type: String, required: [true, "Required store name !"] },
    storeType: { type: String, enum: businessTypes, required: true },
    storeLicense: { type: String, required: false },
    address: {
        country: { type: String, required: true },
        division: { type: String, required: true },
        city: { type: String, required: true },
        thana: { type: String, required: true },
        landmark: { type: String, required: true },
        postal_code: { type: String, required: true },
    },
    location: {
        type: String,
        latitude: Number,
        longitude: Number,
    },
    createdAt: { type: Date, default: Date.now },
});
module.exports = (0, mongoose_1.model)("Store", storeSchema, "stores");
