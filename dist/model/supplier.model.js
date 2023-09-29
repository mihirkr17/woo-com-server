"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const validator = require("validator");
const bcrypt = require("bcrypt");
const { generateUUID, generateExpireTime, generateSixDigitNumber, generateJwtToken, generateUserDataToken } = require("../utils/generator");
mongoose_1.default.set('maxTimeMS', 30000);
let { Schema, model } = mongoose_1.default;
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
const supplierSchema = new Schema({
    fullName: { type: String, required: true },
    email: {
        type: String,
        required: [true, "Email address required !!!"],
        unique: true,
        validate: [validator.isEmail, "Provide a valid email address !!!"],
    },
    phone: { type: String, required: [true, "Required phone number !"] },
    phonePrefixCode: { type: String, enum: ["880"], default: "880" },
    contactEmail: { type: String },
    password: {
        type: String,
        minLength: [5, "Password must be greater than or equal to 5 characters !!!",],
        required: [true, "Password required !"]
    },
    hasPassword: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        default: "SUPPLIER",
    },
    storeName: { type: String, required: [true, "Required store name !"] },
    storeType: { type: String, enum: businessTypes, required: true },
    storeLicense: { type: String, required: false, },
    gender: {
        type: String, required: true, enum: ["Male", "Female", "Others"]
    },
    dob: { type: String, required: true },
    taxID: { type: String, required: false },
    numOfProducts: { type: Number, required: false },
    productInFulfilled: { type: Number, required: false },
    productInDraft: { type: Number, required: false },
    address: {
        country: { type: String, required: true },
        division: { type: String, required: true },
        city: { type: String, required: true },
        thana: { type: String, required: true },
        landmark: { type: String, required: true },
        postal_code: { type: String, required: true }
    },
    location: {
        type: String,
        latitude: Number,
        longitude: Number
    },
    idFor: { type: String, default: "sell" },
    accountStatus: { type: String, enum: ["Active", "Inactive", "Blocked"], default: "Inactive", },
    authProvider: { type: String, enum: ['system', 'thirdParty'], default: 'system' },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
// pre middleware
supplierSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (this.isModified("password")) {
                this.password = yield bcrypt.hash(this.password, 10);
                this.hasPassword = true;
            }
            this.authProvider = 'system';
            this.contactEmail = this.email;
            this.verified = false;
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
// compare client password
supplierSchema.methods.comparePassword = function (clientPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield bcrypt.compare(clientPassword, this.password);
        }
        catch (error) {
            throw error;
        }
    });
};
module.exports = model("Supplier", supplierSchema, "suppliers");
