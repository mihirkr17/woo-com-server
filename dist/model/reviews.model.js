"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    product_id: { type: String, required: true },
    name: { type: String, required: true },
    customer_id: { type: String, required: true },
    order_id: { type: String, required: true },
    order_item_id: { type: String, required: true },
    product_images: { type: Array },
    comments: { type: String, required: false },
    rating_point: { type: Number, required: true },
    verified_purchase: Boolean,
    likes: Array,
    replied: {
        by: { type: String, required: false },
        message: { type: String, required: false },
        replied_at: Date
    },
    review_at: { type: Date }
});
const Review = (0, mongoose_1.model)("reviews", reviewSchema, "reviews");
module.exports = Review;
