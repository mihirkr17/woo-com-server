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
    taxID: { type: String, required: false },
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
const MyStore = (0, mongoose_1.model)("Store", storeSchema, "stores");
const buyerSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "User" },
    taxID: { type: String, required: false },
    shippingAddress: [
        {
            _id: false,
            id: { type: String, required: false },
            name: { type: String, default: "", required: false },
            division: { type: String, default: "", required: false },
            city: { type: String, default: "", required: false },
            area: { type: String, default: "", required: false },
            areaType: { type: String, default: "", required: false },
            landmark: { type: String, default: "", required: false },
            phoneNumber: { type: String, default: "", required: false },
            postalCode: { type: String, default: "", required: false },
            active: Boolean,
        },
    ],
});
const BuyerMeta = (0, mongoose_1.model)("Buyer", buyerSchema, "buyers");
module.exports = { MyStore, BuyerMeta };
