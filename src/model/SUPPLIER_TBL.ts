import { Schema, model } from "mongoose";

const bcrypt = require("bcrypt");

const supplierSchema = new Schema({
  storeInformation: {
    storeName: String,
    registrationNumber: String,
    taxIdentificationNumber: String,
    imageLink: String,
  },
  personalInformation: {
    profileImageLink: String,
    fullName: String,
    position: String,
    email: String,
    countryCode: { type: String, enum: ["+880"] },
    phone: String,
    gender: { type: String, enum: ["Male", "Female", "Others"] },
    address: {
      label: String,
      postalCode: String,
      latitude: String,
      longitude: String,
      landmark: String,
    },
  },
  paymentAndInvoicing: {
    paymentTerms: String,
    bankAccountInfo: String,
    invoicingDetails: String,
  },
  shippingInformation: {
    shippingTerms: String,
    shippingMethods: { type: [String], default: undefined },
    warehouseLocations: { type: [String], default: undefined },
  },
  qualityAndCompliance: {
    certifications: { type: [String], default: undefined },
    complianceWithStandards: { type: Boolean },
  },
  documents: {
    docType: { type: String, enum: ["National ID", "Passport ID"] },
    docImageLink: String,
    docId: String,
  },
  credentials: {
    name: { type: String, required: [true, "Required Name!"] },
    email: {
      type: String,
      required: [true, "Required credential email address!"],
      trim: true,
      unique: true, // If you want to enforce uniqueness
      lowercase: true, // If you want to store emails in lowercase
    },
    password: { type: String, required: [true, "Required password!"] },
  },
  role: { type: String, enum: ["SUPPLIER"] },
  termsAndConditionsAgreement: Boolean,
  additionalInformation: String,
  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String, default: undefined },
  status: {
    type: String,
    enum: ["under review", "verified", "blocked", "aspiring"],
    default: "aspiring",
  },
  statusHistory: [
    {
      _id: false,
      name: String,
      at: { type: Date, default: Date.now() },
    },
  ],
  fulfilled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now() },
  verifiedAt: { type: Date, default: undefined },
  verifiedBy: { type: String, enum: ["WooKart Assured"], default: undefined },
});

// pre save action
supplierSchema.pre("save", async function (next: any) {
  try {
    if (this.isModified("credentials.password") && this.credentials?.password) {
      this.credentials.password = await bcrypt.hash(
        this.credentials.password,
        10
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});

supplierSchema.methods.comparedPassword = async function (
  inputPassword: string
) {
  try {
    return await bcrypt.compare(inputPassword, this.credentials.password);
  } catch (error) {
    throw error;
  }
};

module.exports = model("SUPPLIER_TBL", supplierSchema, "SUPPLIER_TBL");
