import { Schema, model } from "mongoose";
const bcrypt = require("bcrypt");
const validator = require("validator");
const saltRounds = 10;

const buyerType = new Schema({
  taxId: { type: String },
  defaultShippingAddress: { type: Object },
  shoppingCartItems: { type: Array },
  wishlist: { type: Number },
  shippingAddress: [
    {
      _id: false,
      addrsID: { type: Number },
      name: { type: String, default: "" },
      division: { type: String, default: "" },
      city: { type: String, default: "" },
      area: { type: String, default: "" },
      area_type: { type: String, default: "" },
      landmark: { type: String, default: "" },
      phone_number: { type: Number, default: 0 },
      postal_code: { type: Number, default: 0 },
      default_shipping_address: { type: Boolean }
    }
  ],
}, { _id: false });

const sellerType = new Schema({
  taxId: { type: String },
  address: {
    country: { type: String },
    division: { type: String },
    city: { type: String },
    area: { type: String },
    landmark: { type: String, default: "" },
    postal_code: { type: String }
  },
  storeInfos: {
    storeName: { type: String },
    storeLicense: { type: String },
    numOfProducts: { type: Number },
    productInFulfilled: { type: Number },
    productInDraft: { type: Number }
  }

}, { _id: false });

// Interface of user
interface IUser {
  _uuid: String;
  fullName: String;
  phone: String;
  phonePrefixCode: String;
  email: String;
  contactEmail: String;
  password: String;
  hasPassword: Boolean;
  role: String;
  gender: String;
  dob: String;
  isSeller?: String;
  idFor: String;
  accountStatus: String;
  authProvider: String;
  verifyToken: String;
  createdAt: Date;
  becomeSellerAt?: Date;
  seller: any;
  buyer: any;
}

// user schema design
var UserSchema = new Schema<IUser>({
  _uuid: { type: String },
  fullName: { type: String, required: true },

  email: {
    type: String,
    required: [true, "Email address required !!!"],
    unique: true,
    validate: [validator.isEmail, "Provide a valid email address !!!"],
  },

  phone: { type: String },
  phonePrefixCode: { type: String, enum: ["880"], default: "880" },

  contactEmail: { type: String },

  password: {
    type: String,
    minLength: [5, "Password must be greater than or equal to 5 characters !!!",],
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

  dob: { type: String, required: true },

  seller: { type: sellerType, default: undefined },

  buyer: { type: buyerType, default: undefined },

  isSeller: { type: String, enum: ['pending', 'fulfilled'], default: undefined },

  idFor: { type: String, enum: ['sell', 'buy'], default: undefined },

  accountStatus: { type: String, enum: ["active", "inactive", "blocked"], default: "inactive", },

  authProvider: { type: String, enum: ['system', 'thirdParty'], default: 'system' },

  verifyToken: { type: String, default: undefined },

  createdAt: { type: Date, default: Date.now },

  becomeSellerAt: { type: Date, default: undefined }
});

// user password hashing before save into database
UserSchema.pre("save", async function (next: any) {
  let password = this.password;
  let authProvider = this.authProvider;
  let emailAddr = this.email;

  if (this.idFor === 'sell') {
    this.role = 'SELLER'
  }

  if (this.idFor === 'buy') {
    this.role = 'BUYER'
  }

  if (authProvider === 'thirdParty') {
    next();
  }

  // hashing password throw bcrypt
  let hashedPwd = await bcrypt.hash(password, saltRounds);

  this.contactEmail = emailAddr;
  this.password = hashedPwd;
  this.hasPassword = true;
  this.accountStatus = "inactive";

  next();
});


var User = model<IUser>("User", UserSchema, "users");
module.exports = User;
