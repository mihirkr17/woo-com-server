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
// user schema design
var UserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, "Email address required !!!"],
        unique: true,
        validate: [validator.isEmail, "Provide a valid email address !!!"],
    },
    username: { type: String, required: true, unique: true },
    password: {
        type: String,
        minLength: [5, "Password must be greater than or equal to 5 characters !!!",],
    },
    role: {
        type: String,
        enum: ["user", "seller", "admin", "owner"],
        default: "user",
    },
    shippingAddress: [
        {
            name: { type: String, default: "" },
            district: { type: String, default: "" },
            street: { type: String, default: "" },
            state: { type: String, default: "" },
            country: { type: String, default: "" },
            phoneNumber: { type: Number, default: 0 },
            altPhoneNumber: { type: Number, default: 0 },
            pinCode: { type: Number, default: 0 },
        }
    ],
    status: { type: String, enum: ["offline", "online"], default: "offline" },
    accountStatus: { type: String, enum: ["active", "inactive", "blocked"], default: "active", },
    loginCredential: { type: String, enum: ['system', 'thirdParty'], default: 'system' },
    myCartProduct: [],
    createdAt: { type: Date, default: Date.now },
});
// user password hashing before save into database
UserSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        let password = this.password;
        let loginCredential = this.loginCredential;
        if (loginCredential === 'thirdParty') {
            next();
        }
        // hashing password throw bcrypt
        let hashedPwd = yield bcrypt.hash(password, saltRounds);
        this.password = hashedPwd;
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
