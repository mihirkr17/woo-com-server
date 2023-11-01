// import { Schema, model } from "mongoose";
import mongoose from "mongoose";
const bcrypt = require("bcrypt");

mongoose.set("maxTimeMS", 30000);
let { Schema, model } = mongoose;

const validator = require("validator");

// user schema design
var UserSchema = new Schema({
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
    enum: ["CUSTOMER", "SUPPLIER", "ADMIN"],
  },

  idFor: { type: String, enum: ["buy", "sell", "administration"] },

  accountStatus: {
    type: String,
    enum: ["Active", "Inactive", "Blocked"],
    default: "Inactive",
  },

  authProvider: {
    type: String,
    enum: ["system", "thirdParty"],
    default: "system",
  },

  verified: { type: Boolean, default: false },

  devices: Array,

  otp: { type: String, default: undefined },

  otpExTime: { type: Date, default: undefined },

  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre("save", async function (next: any) {
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
UserSchema.methods.comparePassword = async function (clientPassword: string) {
  try {
    return await bcrypt.compare(clientPassword, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = model("User", UserSchema, "users");
