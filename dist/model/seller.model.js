"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const saltRounds = 10;
var SellerSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
        minLength: [5, "Password must be greater than or equal to 5 characters !!!",],
    },
    role: {
        type: String,
        enum: ["user", "seller", "admin", "owner"],
        default: "seller",
    },
});
var Seller = (0, mongoose_1.model)('Seller', SellerSchema);
