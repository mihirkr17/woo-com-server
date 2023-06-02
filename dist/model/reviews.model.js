"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    productID: { type: String, required: true },
    name: { type: String, required: true },
    customerID: { type: String, required: true },
    orderID: { type: String, required: true },
    orderItemID: { type: String, required: true },
    product_images: { type: Array },
    product_review: { type: String, required: false },
    rating_point: { type: Number, required: true },
    likes: Array,
    disLikes: Array,
    replied: {
        by: { type: String, required: false },
        message: { type: String, required: false },
        replied_at: Date
    },
    review_at: { type: Date }
});
const Review = (0, mongoose_1.model)("reviews", reviewSchema, "reviews");
module.exports = Review;
