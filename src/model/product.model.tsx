import { Schema, model } from "mongoose";

const sellerDataType = new Schema({
   storeName: { type: String, required: true },
   sellerID: { type: String, required: true },
   sellerName: { type: String, required: true }
}, { _id: false });

const taxType = new Schema({
   hsn: { type: String, required: true },
   code: { type: String, required: true }
}, { _id: false });

const shippingType = new Schema({
   fulfilledBy: { type: String, required: true },
   procurementType: { type: String, required: true },
   procurementSLA: { type: String, required: true },
   provider: { type: String, required: true },
   delivery: {
      localCharge: { type: Number, required: true },
      zonalCharge: { type: Number, required: true }
   }
}, { _id: false });

const manufacturerType = new Schema({
   origin: { type: String, required: true },
   details: { type: String, required: true }
}, { _id: false });


const bodyInfoType = new Schema({
   keyFeatures: { type: Array, required: true },
   searchKeywords: { type: Array, required: true },
   metaDescription: { type: String, required: true },
   description: { type: String, required: true }
}, { _id: false });

var ProductSchema = new Schema({
   _LID: { type: String, required: true },
   title: { type: String, required: true },
   slug: { type: String, required: true },
   categories: { type: Array, required: true },
   brand: { type: String, required: true },
   manufacturer: { type: manufacturerType, required: true },
   shipping: { type: shippingType, required: true },
   paymentInfo: { type: Array, required: true },
   rating: { type: Array, required: true },
   reviews: { type: Array, required: true },
   ratingAverage: { type: Number, required: true, default: 0 },
   bodyInfo: { type: bodyInfoType, required: true },
   specification: { type: Object, required: true },
   variations: { type: Array, required: true },
   tax: { type: taxType, required: true },
   sellerData: { type: sellerDataType, required: true },
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

const Product = model('Product', ProductSchema, 'products');

module.exports = Product;
