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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const saltRounds = 10;
const buyerType = new mongoose_1.Schema({
    taxId: { type: String },
    shoppingCart: { type: Object },
    shippingAddress: [
        {
            _id: false,
            _SA_UID: { type: Number },
            name: { type: String, default: "" },
            division: { type: String, default: "" },
            city: { type: String, default: "" },
            area: { type: String, default: "" },
            area_type: { type: String, default: "" },
            landmark: { type: String, default: "" },
            phone_number: { type: Number, default: 0 },
            postal_code: { type: Number, default: 0 },
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
    _UUID: { type: String },
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
// user password hashing before save into database
UserSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        let password = this.password;
        let authProvider = this.authProvider;
        let emailAddr = this.email;
        if (this.idFor === 'sell') {
            this.role = 'SELLER';
        }
        if (this.idFor === 'buy') {
            this.role = 'BUYER';
        }
        if (authProvider === 'thirdParty') {
            next();
        }
        // hashing password throw bcrypt
        let hashedPwd = yield bcrypt.hash(password, saltRounds);
        this.contactEmail = emailAddr;
        this.password = hashedPwd;
        this.hasPassword = true;
        next();
    });
});
// check or compare user password from hash password
// UserSchema.methods.comparePassword = async function (password: any, hash: any) {
//   try {
//     return await bcrypt.compare(password, hash);
//   } catch (error: any) {
//     throw new Error(error);
//   }
// };
var User = (0, mongoose_1.model)("User", UserSchema, "users");
module.exports = User;
