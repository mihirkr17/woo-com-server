"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const validator = require("validator");
mongoose_1.default.set('maxTimeMS', 30000);
let { Schema, model } = mongoose_1.default;
const storeSchema = new Schema({
    phones: { type: String, required: false },
    taxID: { type: String, required: false },
    name: { type: String, required: false },
    license: { type: String, required: false },
    numOfProducts: { type: Number, required: false },
    productInFulfilled: { type: Number, required: false },
    productInDraft: { type: Number, required: false },
    address: {
        country: { type: String, required: false },
        division: { type: String, required: false },
        city: { type: String, required: false },
        area: { type: String, required: false },
        landmark: { type: String, default: "", required: false },
        postal_code: { type: String, required: false }
    }
}, { _id: false });
const supplierSchema = new Schema({
    fullName: { type: String, required: true },
    email: {
        type: String,
        required: [true, "Email address required !!!"],
        unique: true,
        validate: [validator.isEmail, "Provide a valid email address !!!"],
    },
    phone: { type: String, required: true },
    phonePrefixCode: { type: String, enum: ["880"], default: "880" },
    contactEmail: { type: String },
    password: {
        type: String,
        minLength: [5, "Password must be greater than or equal to 5 characters !!!",],
        required: true
    },
    hasPassword: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        default: "SUPPLIER",
    },
    gender: {
        type: String, required: true, enum: ["Male", "Female", "Others"]
    },
    dob: { type: String, required: false },
    taxID: { type: String, required: false },
    name: { type: String, required: false },
    license: { type: String, required: false },
    numOfProducts: { type: Number, required: false },
    productInFulfilled: { type: Number, required: false },
    productInDraft: { type: Number, required: false },
    address: {
        country: { type: String, required: false },
        division: { type: String, required: false },
        city: { type: String, required: false },
        area: { type: String, required: false },
        landmark: { type: String, default: "", required: false },
        postal_code: { type: String, required: false }
    },
    idFor: { type: String, default: "sell" },
    accountStatus: { type: String, enum: ["active", "inactive", "blocked"], default: "inactive", },
    authProvider: { type: String, enum: ['system', 'thirdParty'], default: 'system' },
    verificationCode: { type: String, default: undefined },
    verificationExpiredAt: { type: Number, default: undefined },
    createdAt: { type: Date, default: Date.now }
});
module.exports = model("Supplier", supplierSchema, "suppliers");
