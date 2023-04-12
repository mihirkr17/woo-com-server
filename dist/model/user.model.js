"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const saltRounds = 10;
const buyerType = new mongoose_1.Schema({
    taxId: { type: String },
    defaultShippingAddress: { type: Object },
    wishlist: { type: Array },
    shippingAddress: [
        {
            _id: false,
            addrsID: { type: String },
            name: { type: String, default: "" },
            division: { type: String, default: "" },
            city: { type: String, default: "" },
            area: { type: String, default: "" },
            area_type: { type: String, default: "" },
            landmark: { type: String, default: "" },
            phone_number: { type: String, default: "" },
            postal_code: { type: String, default: "" },
            default_shipping_address: { type: Boolean }
        }
    ],
}, { _id: false });
const sellerType = new mongoose_1.Schema({
    taxId: { type: String },
    address: {
        country: { type: String },
        division: { type: String },
        city: { type: String },
        area: { type: String },
        landmark: { type: String, default: "" },
        postal_code: { type: String }
    },
    storeInfos: {
        storeName: { type: String },
        storeLicense: { type: String },
        numOfProducts: { type: Number },
        productInFulfilled: { type: Number },
        productInDraft: { type: Number }
    }
}, { _id: false });
// user schema design
var UserSchema = new mongoose_1.Schema({
    _uuid: { type: String },
    fullName: { type: String, required: true },
    email: {
        type: String,
        required: [true, "Email address required !!!"],
        unique: true,
        validate: [validator.isEmail, "Provide a valid email address !!!"],
    },
    phone: { type: String },
    phonePrefixCode: { type: String, enum: ["880"], default: "880" },
    contactEmail: { type: String },
    password: {
        type: String,
        minLength: [5, "Password must be greater than or equal to 5 characters !!!",],
    },
    hasPassword: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ["BUYER", "SELLER", "ADMIN", "OWNER"],
        default: "BUYER",
    },
    gender: {
        type: String, required: true, enum: ["Male", "Female", "Others"]
    },
    dob: { type: String, required: true },
    seller: { type: sellerType, default: undefined },
    buyer: { type: buyerType, default: undefined },
    isSeller: { type: String, enum: ['pending', 'fulfilled'], default: undefined },
    idFor: { type: String, enum: ['sell', 'buy'], default: undefined },
    accountStatus: { type: String, enum: ["active", "inactive", "blocked"], default: "inactive", },
    authProvider: { type: String, enum: ['system', 'thirdParty'], default: 'system' },
    verifyToken: { type: String, default: undefined },
    createdAt: { type: Date, default: Date.now },
    becomeSellerAt: { type: Date, default: undefined }
});
var User = (0, mongoose_1.model)("User", UserSchema, "users");
module.exports = User;
