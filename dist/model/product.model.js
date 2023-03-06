"use strict";
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
    isFree: { type: Boolean }
}, { _id: false });
const manufacturerType = new mongoose_1.Schema({
    origin: { type: String, required: true },
    details: { type: String, required: true }
}, { _id: false });
const bodyInfoType = new mongoose_1.Schema({
    keyFeatures: { type: Array, required: true },
    searchKeywords: { type: Array, required: true },
    metaDescription: { type: String, required: true }
}, { _id: false });
var ProductSchema = new mongoose_1.Schema({
    _LID: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    pricing: { type: Object, required: true },
    categories: { type: Array, required: true },
    brand: { type: String, required: true },
    images: { type: Array, required: true },
    manufacturer: { type: manufacturerType, required: true },
    package: { type: Object, required: true },
    shipping: { type: shippingType, required: true },
    paymentInfo: { type: Array, required: true },
    rating: { type: Array, required: true },
    reviews: { type: Array, required: true },
    ratingAverage: { type: Number, required: true, default: 0 },
    bodyInfo: { type: bodyInfoType, required: true },
    specification: { type: Object, required: true },
    description: { type: String, required: true },
    variations: { type: Array, required: true },
    tax: { type: taxType, required: true },
    sellerData: { type: sellerDataType, required: true },
    warranty: { type: Object },
    save_as: { type: String, required: true, enum: ["fulfilled", "draft"] },
    createdAt: { type: Date, required: true },
    modifiedAt: { type: Date, required: false },
    isVerified: { type: Boolean, required: true },
    verifyStatus: {
        verifiedBy: { type: String, required: true },
        email: { type: String, required: true },
        verifiedAt: { type: Date, required: true }
    }
});
const Product = (0, mongoose_1.model)('Product', ProductSchema, 'products');
module.exports = Product;
