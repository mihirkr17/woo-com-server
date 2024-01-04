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
const customerSchema = new mongoose_1.Schema({
    taxId: { type: String, required: false },
    contactEmail: { type: String },
    fullName: { type: String, required: true },
    email: {
        type: String,
        required: [true, "Email address required !!!"],
        unique: true,
        validate: [validator.isEmail, "Provide a valid email address !!!"],
    },
    phone: { type: String, required: true },
    gender: {
        type: String,
        enum: ["Male", "Female", "Others"],
        required: [true, "Required gender information!"],
    },
    dob: String,
    phonePrefixCode: { type: String, enum: ["880"], default: "880" },
    password: {
        type: String,
        minLength: [
            5,
            "Password must be greater than or equal to 5 characters !!!",
        ],
        required: true,
    },
    hasPassword: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ["CUSTOMER"],
    },
    verified: Boolean,
    authProvider: String,
    accountStatus: { type: String, enum: ["active", "deactivated", "blocked"] },
    devices: Array,
    createdAt: { type: Date, default: Date.now },
});
customerSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (this.isModified("password")) {
                this.password = yield bcrypt.hash(this.password, 10);
                this.hasPassword = true;
            }
            if (this.isModified("verified")) {
                this.verified = this.verified;
            }
            this.authProvider = "system";
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
// compare client password
customerSchema.methods.comparePassword = function (clientPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield bcrypt.compare(clientPassword, this.password);
        }
        catch (error) {
            throw error;
        }
    });
};
module.exports = (0, mongoose_1.model)("CUSTOMER_TBL", customerSchema, "CUSTOMER_TBL");
