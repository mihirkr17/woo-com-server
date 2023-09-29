// import { Schema, model } from "mongoose";
import mongoose from "mongoose";
const bcrypt = require("bcrypt");

mongoose.set('maxTimeMS', 30000);
let { Schema, model } = mongoose;

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


UserSchema.pre("save", async function (next: any) {

  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
      this.hasPassword = true;
    }

    this.authProvider = 'system';
    this.contactEmail = this.email;

    this.verified = false;

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


module.exports = model("User", UserSchema, "users");;
