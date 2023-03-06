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
   isFree: { type: Boolean }
}, { _id: false });

const manufacturerType = new Schema({
   origin: { type: String, required: true },
   details: { type: String, required: true }
}, { _id: false });


const bodyInfoType = new Schema({
   keyFeatures: { type: Array, required: true },
   searchKeywords: { type: Array, required: true },
   metaDescription: { type: String, required: true }
}, { _id: false });

var QueueProductSchema = new Schema({
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
   description: { type: String, required: true },
   variations: { type: Array, required: false, default: [] },
   tax: { type: taxType, required: true },
   sellerData: { type: sellerDataType, required: true },
   save_as: { type: String, required: true, default: "queue" },
   createdAt: { type: Date, default: Date.now },
   package: { type: Object, required: true },
   modifiedAt: { type: Date, required: false, default: "" },
   isVerified: { type: Boolean, default: false },
   pricing: { type: Object, required: true },
   images: { type: Array, required: true },
   warranty: { type: Object },
   verifyStatus: {
      verifiedBy: { type: String, required: false },
      email: { type: String, required: false },
      verifiedAt: { type: Date, required: false }
   }
});

QueueProductSchema.pre("save", async function (next: any) {
   let listingID = "LID" + Math.random().toString(36).toUpperCase().slice(2, 18);

   if (listingID) {
      this._LID = listingID;
   }

   next();
});

const QueueProduct = model('QueueProduct', QueueProductSchema, 'queueProducts');

module.exports = QueueProduct;