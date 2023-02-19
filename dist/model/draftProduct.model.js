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
const sellerDataType = new mongoose_1.Schema({
    storeName: { type: String, required: true },
    sellerID: { type: String, required: true },
    sellerName: { type: String, required: true }
}, { _id: false });
const taxType = new mongoose_1.Schema({
    hsn: { type: String, required: true },
    code: { type: String, required: true }
}, { _id: false });
const shippingType = new mongoose_1.Schema({
    fulfilledBy: { type: String, required: true },
    procurementType: { type: String, required: true },
    procurementSLA: { type: String, required: true },
    provider: { type: String, required: true },
    delivery: {
        localCharge: { type: Number, required: true },
        zonalCharge: { type: Number, required: true }
    }
}, { _id: false });
const manufacturerType = new mongoose_1.Schema({
    origin: { type: String, required: true },
    details: { type: String, required: true }
}, { _id: false });
const bodyInfoType = new mongoose_1.Schema({
    keyFeatures: { type: Array, required: true },
    searchKeywords: { type: Array, required: true },
    metaDescription: { type: String, required: true },
    description: { type: String, required: true }
}, { _id: false });
var DraftProductSchema = new mongoose_1.Schema({
    _LID: { type: String },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    categories: { type: Array, required: true },
    brand: { type: String, required: true },
    manufacturer: { type: manufacturerType, required: true },
    shipping: { type: shippingType, required: true },
    paymentInfo: { type: Array, required: true },
    rating: { type: Array, required: false },
    reviews: { type: Array, required: false, default: [] },
    ratingAverage: { type: Number, required: false, default: 0 },
    bodyInfo: { type: bodyInfoType, required: true },
    specification: { type: Object, required: false, default: {} },
    variations: { type: Array, required: false, default: [] },
    tax: { type: taxType, required: true },
    sellerData: { type: sellerDataType, required: true },
    save_as: { type: String, required: true, default: "draft" },
    createdAt: { type: Date, default: new Date() },
    modifiedAt: { type: Date, required: false, default: "" },
    isVerified: { type: Boolean, default: false }
});
DraftProductSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        let listingID = "LID" + Math.random().toString(36).toUpperCase().slice(2, 18);
        if (listingID) {
            this._LID = listingID;
        }
        next();
    });
});
const DraftProduct = (0, mongoose_1.model)('DraftProduct', DraftProductSchema, 'draftProducts');
module.exports = DraftProduct;
