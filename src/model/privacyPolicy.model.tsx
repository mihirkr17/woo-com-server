// src/model/privacyPolicy.tsx;

import { Schema, model } from "mongoose";

const privacyPolicySchema = new Schema({
   pay_information: Array,
   support_email: String,
   purchase_last_note: String,
   purchase_policy: Array,
   refund_policy: Array,
   replace_policy: Array,
   legal_disclaimer: String
});

const PrivacyPolicy = model("privacy-policy", privacyPolicySchema, "privacy-policy");

module.exports = PrivacyPolicy;