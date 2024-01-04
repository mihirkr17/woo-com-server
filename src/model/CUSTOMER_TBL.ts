import { Schema, model } from "mongoose";
const bcrypt = require("bcrypt");

const validator = require("validator");

const customerSchema = new Schema({
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

customerSchema.pre("save", async function (next: any) {
  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
      this.hasPassword = true;
    }

    if (this.isModified("verified")) {
      this.verified = this.verified;
    }

    this.authProvider = "system";

    next();
  } catch (error: any) {
    next(error);
  }
});

// compare client password
customerSchema.methods.comparePassword = async function (
  clientPassword: string
) {
  try {
    return await bcrypt.compare(clientPassword, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = model("CUSTOMER_TBL", customerSchema, "CUSTOMER_TBL");
