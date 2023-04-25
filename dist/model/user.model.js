"use strict";
// import { Schema, model } from "mongoose";
const mongoose = require("mongoose");
mongoose.set('maxTimeMS', 30000);
let { Schema, model } = mongoose;
const validator = require("validator");
// user schema design
var UserSchema = new Schema({
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
    seller: {
        taxId: { type: String, required: false },
        address: {
            country: { type: String, required: false },
            division: { type: String, required: false },
            city: { type: String, required: false },
            area: { type: String, required: false },
            landmark: { type: String, default: "", required: false },
            postal_code: { type: String, required: false }
        },
        storeInfos: {
            storeName: { type: String, required: false },
            storeLicense: { type: String, required: false },
            numOfProducts: { type: Number, required: false },
            productInFulfilled: { type: Number, required: false },
            productInDraft: { type: Number, required: false }
        }
    },
    buyer: {
        taxId: { type: String, required: false },
        defaultShippingAddress: { type: Object, required: false },
        wishlist: { type: Array, required: false },
        shippingAddress: [
            {
                _id: false,
                addrsID: { type: String, required: false },
                name: { type: String, default: "", required: false },
                division: { type: String, default: "", required: false },
                city: { type: String, default: "", required: false },
                area: { type: String, default: "", required: false },
                area_type: { type: String, default: "", required: false },
                landmark: { type: String, default: "", required: false },
                phone_number: { type: String, default: "", required: false },
                postal_code: { type: String, default: "", required: false },
                default_shipping_address: { type: Boolean, required: false }
            }
        ],
    },
    isSeller: { type: String, enum: ['pending', 'fulfilled'], default: undefined },
    idFor: { type: String, enum: ['sell', 'buy'], default: undefined },
    accountStatus: { type: String, enum: ["active", "inactive", "blocked"], default: "inactive", },
    authProvider: { type: String, enum: ['system', 'thirdParty'], default: 'system' },
    verifyToken: { type: String, default: undefined },
    createdAt: { type: Date, default: Date.now },
    becomeSellerAt: { type: Date, default: undefined }
});
var User = model("User", UserSchema, "users");
module.exports = User;
