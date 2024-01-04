"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt = require("bcrypt");
const supplierSchema = new mongoose_1.Schema({
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
            unique: true,
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
supplierSchema.pre("save", function (next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (this.isModified("credentials.password") && ((_a = this.credentials) === null || _a === void 0 ? void 0 : _a.password)) {
                this.credentials.password = yield bcrypt.hash(this.credentials.password, 10);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
supplierSchema.methods.comparedPassword = function (inputPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield bcrypt.compare(inputPassword, this.credentials.password);
        }
        catch (error) {
            throw error;
        }
    });
};
module.exports = (0, mongoose_1.model)("SUPPLIER_TBL", supplierSchema, "SUPPLIER_TBL");
