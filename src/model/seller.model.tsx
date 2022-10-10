import { Schema, model } from "mongoose";
const bcrypt = require("bcrypt");
const validator = require("validator");
const saltRounds = 10;

interface ISeller {
   email: String;
   password: String;
   role: String;
}

var SellerSchema = new Schema<ISeller>({
   email: { type: String, required: true, unique: true },
   password: {
      type: String,
      minLength: [5, "Password must be greater than or equal to 5 characters !!!",],
   },
   role: {
      type: String,
      enum: ["user", "seller", "admin", "owner"],
      default: "seller",
   },
});

var Seller = model<ISeller>('Seller', SellerSchema);