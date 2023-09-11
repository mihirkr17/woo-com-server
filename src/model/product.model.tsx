import { Schema, model } from "mongoose";

var ProductSchema = new Schema({
   _lid: { type: String, required: true },

   title: { type: String, required: true },

   slug: { type: String, required: true },

   categories: { type: Array, required: true },

   brand: { type: String, required: true },

   manufacturer: {
      origin: { type: String, required: true },
      details: { type: String, required: true }
   },

   packaged: { type: Object, required: true },

   shipping: {
      fulfilledBy: { type: String, required: true },
      procurementType: { type: String, required: true },
      procurementSLA: { type: String, required: true },
      isFree: { type: Boolean }
   },

   rating: { type: Array, required: true },

   ratingAverage: { type: Number, required: true, default: 0 },

   keywords: { type: Array, required: true },

   metaDescription: { type: String, required: true },

   highlights: { type: Array, required: false },

   specification: { type: Object, required: true },

   description: { type: String, required: true },

   variations: { type: Array, required: true },

   supplier: {
      storeId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
      storeName: { type: String, required: true }
   },

   warranty: {
      type: { type: String, required: false },
      duration: { type: String, required: false },
      details: { type: String, required: false }
   },

   status: { type: String, required: true, enum: ["Active", "Queue", "Draft"], default: "Queue" },

   views: { type: Number },

   score: { type: Number },

   sales: { type: Number },

   createdAt: { type: Date, required: true },

   modifiedAt: { type: Date, required: false },

   isVerified: { type: Boolean, required: false },

   verifyStatus: {
      verifiedBy: { type: String, required: false },
      email: { type: String, required: false },
      verifiedAt: { type: Date, required: false }
   }
});


const Product = model('Product', ProductSchema, 'products');

module.exports = Product;
