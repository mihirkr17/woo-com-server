import mongoose from "mongoose";
const validator = require("validator");
const bcrypt = require("bcrypt");
const { generateUUID, generateExpireTime, generateSixDigitNumber, generateJwtToken, generateUserDataToken } = require("../utils/generator");
mongoose.set('maxTimeMS', 30000);
let { Schema, model } = mongoose;

const businessTypes = [
   "Fashion and Apparel",
   "Electronics",
   "Home and Furniture",
   "Beauty and Personal Care",
   "Toys and Games",
   "Sports and Outdoors",
   "Books and Media",
   "Handmade and Crafts",
   "Health and Wellness",
   "Automotive",
   "Food and Grocery",
];



const supplierSchema = new Schema({
   fullName: { type: String, required: true },

   email: {
      type: String,
      required: [true, "Email address required !!!"],
      unique: true,
      validate: [validator.isEmail, "Provide a valid email address !!!"],
   },

   phone: { type: String, required: [true, "Required phone number !"] },

   phonePrefixCode: { type: String, enum: ["880"], default: "880" },

   contactEmail: { type: String },

   password: {
      type: String,
      minLength: [5, "Password must be greater than or equal to 5 characters !!!",],
      required: [true, "Password required !"]
   },

   hasPassword: {
      type: Boolean,
      default: false
   },

   role: {
      type: String,
      default: "SUPPLIER",
   },

   storeName: { type: String, required: [true, "Required store name !"] },

   storeType: { type: String, enum: businessTypes, required: true },

   storeLicense: { type: String, required: false, },

   gender: {
      type: String, required: true, enum: ["Male", "Female", "Others"]
   },

   dob: { type: String, required: true },

   taxID: { type: String, required: false },

   numOfProducts: { type: Number, required: false },

   productInFulfilled: { type: Number, required: false },

   productInDraft: { type: Number, required: false },

   address: {
      country: { type: String, required: true },
      division: { type: String, required: true },
      city: { type: String, required: true },
      thana: { type: String, required: true },
      landmark: { type: String, required: true },
      postal_code: { type: String, required: true }
   },

   idFor: { type: String, default: "sell" },

   accountStatus: { type: String, enum: ["active", "inactive", "blocked"], default: "inactive", },

   authProvider: { type: String, enum: ['system', 'thirdParty'], default: 'system' },

   verified: { type: Boolean, default: false },

   createdAt: { type: Date, default: Date.now }
});


// pre middleware
supplierSchema.pre("save", async function (next: any) {
   try {
      if (this.isModified("password")) {
         this.password = await bcrypt.hash(this.password, 10);
      }

      this.authProvider = 'system';
      this.role = "SUPPLIER";
      this.idFor = "sell";
      this.contactEmail = this.email;
      this.hasPassword = true;
      this.accountStatus = "inactive";
      this.verified = false;

      next();
   } catch (error: any) {
      next(error);
   }
});


// compare client password
supplierSchema.methods.comparePassword = async function (clientPassword: string) {
   try {
      return await bcrypt.compare(clientPassword, this.password);
   } catch (error) {
      throw error;
   }
};




module.exports = model("Supplier", supplierSchema, "suppliers");