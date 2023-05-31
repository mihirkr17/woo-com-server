import { Schema, model } from "mongoose";

const reviewSchema = new Schema({
   productID: { type: String, required: true },

   name: { type: String, required: true },

   customerID: { type: String, required: true },

   orderID: { type: String, required: true },

   orderItemID: { type: String, required: true },

   product_images: { type: Array },

   product_review: { type: String, required: false },

   rating_point: { type: Number, required: true }
});

const Review = model("reviews", reviewSchema, "reviews");

module.exports = Review;