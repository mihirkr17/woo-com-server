import { Schema, model } from "mongoose";

var ProductSchema = new Schema({
   _lid: { type: String, required: true },

   title: { type: String, required: true },

   slug: { type: String, required: true },

   pricing: { type: Object, required: true },

   categories: { type: Array, required: true },

   brand: { type: String, required: true },

   images: { type: Array, required: true },

   manufacturer: {
      origin: { type: String, required: true },
      details: { type: String, required: true }
   },

   packaged: { type: Object, required: true },

   shipping: {
      fulfilledBy: { type: String, required: true },
      procurementType: { type: String, required: true },
      procurementSLA: { type: String, required: true },
      provider: { type: String, required: true },
      isFree: { type: Boolean }
   },

   rating: { type: Array, required: true },

   reviews: { type: Array, required: true },

   ratingAverage: { type: Number, required: true, default: 0 },

   bodyInfo: {
      searchKeywords: { type: Array, required: true },
      metaDescription: { type: String, required: true }
   },

   specification: { type: Object, required: true },

   description: { type: String, required: true },

   variations: { type: Array, required: true },

   tax: {
      hsn: { type: String, required: true },
      code: { type: String, required: true }
   },

   sellerData: {
      storeName: { type: String, required: true },
      sellerEmail: { type: String, required: true },
      sellerID: { type: String, required: true },
      sellerName: { type: String, required: true }
   },

   warranty: {
      type: { type: String, required: false },
      duration: { type: Number, required: false },
      details: { type: String, required: false }
   },

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
