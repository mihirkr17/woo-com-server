"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const address1 = new mongoose_1.Schema({
    country: { type: String, required: true },
    division: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    thana: { type: String, required: true },
});
const address2 = new mongoose_1.Schema({
    country: { type: String, default: "" },
    division: { type: String, default: "" },
    city: { type: String, default: "" },
    district: { type: String, default: "" },
    thana: { type: String, default: "" },
});
const storeType = new mongoose_1.Schema({
    shopName: { type: String, required: true },
    shopNumber: { type: String, required: true }
});
const sellerSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    store: { type: storeType },
    phoneNumber: { type: String, required: true },
    phoneNumberAlt: { type: String, required: true },
    address1: { type: address1, required: true },
    address2: { type: address2 }
});
var Seller = (0, mongoose_1.model)("Seller", sellerSchema, 'sellers');
module.exports = Seller;
