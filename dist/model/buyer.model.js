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
// import { Schema, model } from "mongoose";
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt = require("bcrypt");
mongoose_1.default.set('maxTimeMS', 30000);
let { Schema, model } = mongoose_1.default;
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
        default: "BUYER"
    },
    gender: {
        type: String, required: true, enum: ["Male", "Female", "Others"]
    },
    dob: { type: String, required: false },
    taxID: { type: String, required: false },
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
    idFor: { type: String, default: "buy" },
    accountStatus: { type: String, enum: ["Active", "Inactive", "Blocked"], default: "Inactive", },
    authProvider: { type: String, enum: ['system', 'thirdParty'], default: 'system' },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
UserSchema.pre("save", function (next) {
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
UserSchema.methods.comparePassword = function (clientPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield bcrypt.compare(clientPassword, this.password);
        }
        catch (error) {
            throw error;
        }
    });
};
var User = model("User", UserSchema, "users");
module.exports = User;
