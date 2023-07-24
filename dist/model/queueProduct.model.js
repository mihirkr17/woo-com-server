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
var QueueProductSchema = new mongoose_1.Schema({
    _lid: { type: String },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    categories: { type: Array, required: true },
    brand: { type: String, required: true },
    manufacturer: {
        origin: { type: String, required: true },
        details: { type: String, required: true }
    },
    shipping: {
        fulfilledBy: { type: String, required: true },
        procurementType: { type: String, required: true },
        procurementSLA: { type: String, required: true },
        provider: { type: String, required: true },
        isFree: { type: Boolean }
    },
    rating: { type: Array, required: false },
    reviews: { type: Array, required: false, default: [] },
    ratingAverage: { type: Number, required: false, default: 0 },
    keywords: { type: Array, required: true },
    metaDescription: { type: String, required: true },
    highlights: { type: Array, required: false },
    specification: { type: Object, required: false, default: {} },
    description: { type: String, required: true },
    variations: { type: Array, required: false, default: [] },
    tax: {
        hsn: { type: String, required: true },
        code: { type: String, required: true }
    },
    supplier: { type: Object, required: true },
    status: { type: String, required: true, default: "inQueue" },
    createdAt: { type: Date, default: Date.now },
    packaged: { type: Object, required: true },
    modifiedAt: { type: Date, required: false, default: "" },
    isVerified: { type: Boolean, default: false },
    options: [
        {
            _id: false,
            color: String,
            images: Array
        }
    ],
    warranty: {
        type: { type: String, required: false },
        duration: { type: Number, required: false },
        details: { type: String, required: false }
    },
    verifyStatus: {
        verifiedBy: { type: String, required: false },
        email: { type: String, required: false },
        verifiedAt: { type: Date, required: false }
    }
});
QueueProductSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        let listingID = "li_" + Math.random().toString(36).toUpperCase().slice(2, 16);
        if (listingID) {
            this._lid = listingID;
        }
        next();
    });
});
const QueueProduct = (0, mongoose_1.model)('QueueProduct', QueueProductSchema, 'queueProducts');
module.exports = QueueProduct;
