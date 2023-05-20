"use strict";
// src/model/privacyPolicy.tsx;
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const privacyPolicySchema = new mongoose_1.Schema({
    pay_information: Array,
    support_email: String,
    purchase_last_note: String,
    purchase_policy: Array,
    refund_policy: Array,
    replace_policy: Array,
    legal_disclaimer: String
});
const PrivacyPolicy = (0, mongoose_1.model)("privacy-policy", privacyPolicySchema, "privacy-policy");
module.exports = PrivacyPolicy;
