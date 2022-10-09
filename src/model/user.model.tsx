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
  status: String;
  accountStatus: String;
  loginCredential: String;
  myCartProduct: any[],
  createdAt: Date;
}

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
  status: { type: String, enum: ["offline", "online"], default: "offline" },
  accountStatus: { type: String, enum: ["active", "inactive", "blocked"], default: "active", },
  loginCredential: { type: String, enum: ['system', 'thirdParty'], default: 'system' },
  myCartProduct: [],
  createdAt: { type: Date, default: Date.now },
});

// user password hashing before save into database
UserSchema.pre("save", async function (next: any) {
  let password = this.password;
  let loginCredential = this.loginCredential

  if (loginCredential === 'thirdParty') {
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
