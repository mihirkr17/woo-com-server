// import { Schema, model } from "mongoose";
import mongoose from "mongoose";

mongoose.set('maxTimeMS', 30000);
let { Schema, model } = mongoose;

const validator = require("validator");

const storeSchema = new Schema({
  phones: { type: String, required: false },
  taxID: { type: String, required: false },
  name: { type: String, required: false },
  license: { type: String, required: false },
  numOfProducts: { type: Number, required: false },
  productInFulfilled: { type: Number, required: false },
  productInDraft: { type: Number, required: false },
  address: {
    country: { type: String, required: false },
    division: { type: String, required: false },
    city: { type: String, required: false },
    area: { type: String, required: false },
    landmark: { type: String, default: "", required: false },
    postal_code: { type: String, required: false }
  }
}, { _id: false });

const buyerSchema = new Schema({
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
}, { _id: false })

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
    enum: ["BUYER", "SELLER", "ADMIN", "OWNER"],
    default: "BUYER",
  },

  gender: {
    type: String, required: true, enum: ["Male", "Female", "Others"]
  },

  dob: { type: String, required: false },

  store: {
    type: storeSchema, default: undefined
  },

  buyer: {
    type: buyerSchema, default: undefined
  },

  idFor: { type: String, enum: ['sell', 'buy'], default: undefined },

  accountStatus: { type: String, enum: ["active", "inactive", "blocked"], default: "inactive", },

  authProvider: { type: String, enum: ['system', 'thirdParty'], default: 'system' },

  verificationCode: { type: String, default: undefined },
  
  verificationExpiredAt: { type: Number, default: undefined },

  createdAt: { type: Date, default: Date.now }
});

var User = model("User", UserSchema, "users");
module.exports = User;
