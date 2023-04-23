import { Schema, model } from "mongoose";

var QueueProductSchema = new Schema({
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

   bodyInfo: {
      keyFeatures: { type: Array, required: true },
      searchKeywords: { type: Array, required: true },
      metaDescription: { type: String, required: true }
   },

   specification: { type: Object, required: false, default: {} },

   description: { type: String, required: true },

   variations: { type: Array, required: false, default: [] },

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

   save_as: { type: String, required: true, default: "queue" },

   createdAt: { type: Date, default: Date.now },

   packaged: { type: Object, required: true },

   modifiedAt: { type: Date, required: false, default: "" },

   isVerified: { type: Boolean, default: false },

   pricing: { type: Object, required: true },

   images: { type: Array, required: true },

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

QueueProductSchema.pre("save", async function (next: any) {
   let listingID = "li_" + Math.random().toString(36).toUpperCase().slice(2, 16);

   if (listingID) {
      this._lid = listingID;
   }

   next();
});

const QueueProduct = model('QueueProduct', QueueProductSchema, 'queueProducts');

module.exports = QueueProduct;