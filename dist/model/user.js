"use strict";
var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    displayName: { type: String, default: "" },
    role: {
        type: String,
        default: "user",
    },
    shippingAddress: {
        name: { type: String, default: "" },
        district: { type: String, default: "" },
        state: { type: String, default: "" },
        country: { type: String, default: "" },
        phoneNumber: { type: Number, default: 0 },
        altPhoneNumber: { type: Number, default: 0 },
        pinCode: { type: Number, default: 0 },
    }
});
const User = mongoose.model("User", UserSchema, 'users');
module.exports = User;
