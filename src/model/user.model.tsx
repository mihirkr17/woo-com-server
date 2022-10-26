import { Schema, model } from "mongoose";
const bcrypt = require("bcrypt");
const validator = require("validator");
const saltRounds = 10;

// Interface of user
interface IUser {
  email: String;
  username?: String;
  password: String;
  role: String;
  shippingAddress?: any[];
  businessInfo?: any;
  sellerInfo?: any;
  inventoryInfo?: any;
  isSeller?: String;
  accountStatus: String;
  authProvider: String;
  shoppingCartItems?: Number,
  verifyToken: String;
  createdAt: Date;
  becomeSellerAt?: Date;
}

const BusinessInfoSchema = new Schema({
  sellCategory: [String],
  taxID: String,
  stateTaxID: String,
  creditCard: String,
}, { _id: false });

const SellerInfoSchema = new Schema({
  dateOfBirth: String,
  phone: Number,
  address: {
    street: String,
    thana: String,
    district: String,
    state: String,
    country: String,
    pinCode: Number
  }
}, { _id: false });

const InventoryInfoSchema = new Schema({
  earn: Number,
  totalSell: Number,
  totalProducts: Number,
}, { _id: false });

// user schema design
var UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, "Email address required !!!"],
    unique: true,
    validate: [validator.isEmail, "Provide a valid email address !!!"],
  },
  username: { type: String, required: true, unique: true },
  password: {
    type: String,
    minLength: [5, "Password must be greater than or equal to 5 characters !!!",],
  },
  role: {
    type: String,
    enum: ["user", "seller", "admin", "owner"],
    default: "user",
  },

  shippingAddress: [
    {
      addressId: {type: Number},
      name: { type: String, default: "" },
      district: { type: String, default: "" },
      street: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      phoneNumber: { type: Number, default: 0 },
      altPhoneNumber: { type: Number, default: 0 },
      pinCode: { type: Number, default: 0 },
    }
  ],

  businessInfo: { type: BusinessInfoSchema, default: undefined },

  sellerInfo: { type: SellerInfoSchema, default: undefined },

  inventoryInfo: { type: InventoryInfoSchema, default: undefined },

  isSeller: { type: String, enum: ['pending', 'fulfilled'], default: undefined },

  accountStatus: { type: String, enum: ["active", "inactive", "blocked"], default: "inactive", },
  authProvider: { type: String, enum: ['system', 'thirdParty'], default: 'system' },
  shoppingCartItems: {type: Number, default: undefined},
  verifyToken: String,
  createdAt: { type: Date, default: Date.now },
  becomeSellerAt: { type: Date, default: undefined }
});

// user password hashing before save into database
UserSchema.pre("save", async function (next: any) {
  let password = this.password;
  let authProvider = this.authProvider

  if (authProvider === 'thirdParty') {
    next();
  }

  // hashing password throw bcrypt
  let hashedPwd = await bcrypt.hash(password, saltRounds);

  this.password = hashedPwd;

  next();
});

// check or compare user password from hash password
// UserSchema.methods.comparePassword = async function (password: any, hash: any) {
//   try {
//     return await bcrypt.compare(password, hash);

//   } catch (error: any) {
//     throw new Error(error);
//   }
// };

var User = model<IUser>("User", UserSchema, "users");
module.exports = User;
