"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    orderId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
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
const Review = (0, mongoose_1.model)("reviews", reviewSchema, "reviews");
module.exports = Review;
