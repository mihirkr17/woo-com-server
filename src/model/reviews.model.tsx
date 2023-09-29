import { Schema, model } from "mongoose";

const reviewSchema = new Schema({
   productId: { type: Schema.Types.ObjectId, required: true },

   name: { type: String, required: true },

   customerId: { type: Schema.Types.ObjectId, required: true },

   orderId: { type: Schema.Types.ObjectId, required: true },

   productImages: { type: Array },

   comments: { type: String, required: false },

   ratingPoint: { type: Number, required: true },

   verifiedPurchase: Boolean,

   likes: Array,

   replied: {
      by: { type: String, required: false },
      message: { type: String, required: false },
      replied_at: Date
   },

   reviewAt: { type: Date }
});

const Review = model("reviews", reviewSchema, "reviews");

module.exports = Review;