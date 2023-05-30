"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    productID: { type: String, required: true },
    name: { type: String, required: true },
    customerID: { type: String, required: true },
    orderID: { type: String, required: true },
    orderItemID: { type: String, required: true },
    product_review: { type: String, required: false },
    rating_point: { type: Number, required: true }
});
const Review = (0, mongoose_1.model)("reviews", reviewSchema, "reviews");
module.exports = Review;
