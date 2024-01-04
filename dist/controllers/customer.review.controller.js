"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { ObjectId } = require("mongodb");
const Product = require("../model/PRODUCT_TBL");
const ORDER_TABLE = require("../model/ORDER_TBL");
const Review = require("../model/REVIEWS_TBL");
const { Error400, Error401 } = require("../res/response");
const { product_detail_review_pipe } = require("../utils/pipelines");
// adding product review and ratings
module.exports.addProductRating = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { _id } = req.decoded;
        const { orderId, productId, ratingWeight, description, name, reviewImage } = req === null || req === void 0 ? void 0 : req.body;
        const [updatedProduct, newReview, orderUpdateResult] = yield Promise.all([
            Product.findOneAndUpdate({ _id: ObjectId(productId) }, [
                {
                    $set: {
                        rating: {
                            $map: {
                                input: "$rating",
                                as: "rat",
                                in: {
                                    weight: "$$rat.weight",
                                    count: {
                                        $cond: [
                                            { $eq: ["$$rat.weight", parseInt(ratingWeight)] },
                                            { $add: ["$$rat.count", 1] },
                                            "$$rat.count",
                                        ],
                                    },
                                },
                            },
                        },
                        ratingAverage: {
                            $round: [
                                {
                                    $divide: [
                                        {
                                            $reduce: {
                                                input: "$rating",
                                                initialValue: 0,
                                                in: {
                                                    $add: [
                                                        "$$value",
                                                        { $multiply: ["$$this.weight", "$$this.count"] },
                                                    ],
                                                },
                                            },
                                        },
                                        {
                                            $reduce: {
                                                input: "$rating",
                                                initialValue: 0,
                                                in: { $add: ["$$value", "$$this.count"] },
                                            },
                                        },
                                    ],
                                },
                                1,
                            ],
                        },
                    },
                },
            ], { new: true }),
            description &&
                new Review({
                    productId: productId,
                    orderId: orderId,
                    name,
                    customerId: _id,
                    productImages: (_a = reviewImage.slice(0, 5)) !== null && _a !== void 0 ? _a : [],
                    comments: description,
                    ratingPoint: parseInt(ratingWeight),
                    verifiedPurchase: true,
                    likes: [],
                    reviewAt: new Date(Date.now()),
                }).save(),
            ORDER_TABLE.findOneAndUpdate({ _id: ObjectId(orderId) }, {
                $set: {
                    isRated: true,
                },
            }, { upsert: true }),
        ]);
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Thanks for your review !",
        });
    }
    catch (error) {
        next(error);
    }
});
// this is controllers of getting all reviews in product detail page
// get reviews in product detail page
module.exports.getReviews = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    try {
        const { productId } = req.params;
        let { page, sort } = req.query;
        if (!productId)
            throw new Error400("Required product id !");
        page = page && parseInt(page);
        page = typeof page === "number" && page === 1 ? 0 : page - 1;
        let sortFilter = sort === "asc"
            ? { rating_point: 1 }
            : sort === "dsc"
                ? { rating_point: -1 }
                : { _id: -1 };
        const result = (_b = (yield Review.find({ productId: ObjectId(productId) })
            .sort(sortFilter)
            .skip(page * 2)
            .limit(2))) !== null && _b !== void 0 ? _b : [];
        const reviewCount = (_c = (yield Review.countDocuments({ productId: ObjectId(productId) }))) !== null && _c !== void 0 ? _c : 0;
        res
            .status(200)
            .send({ success: true, statusCode: 200, reviews: result, reviewCount });
    }
    catch (error) {
        next(error);
    }
});
module.exports.toggleVotingLike = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // getting uuid from jwt token;
        const { _uuid } = req.decoded;
        // getting review id from req body;
        const { reviewID } = req.body;
        if (!reviewID)
            throw new Error400("Required review id from body !");
        // find one review by review id;
        const review = yield Review.findOne({ _id: ObjectId(reviewID) });
        if (!review)
            throw new Error400("Review not found !");
        // finding user id inside review like array;
        let userIndex = review.likes.indexOf(_uuid);
        if (userIndex !== -1) {
            review.likes.splice(userIndex, 1);
        }
        else {
            review.likes.push(_uuid);
        }
        const result = yield review.save();
        if (!result)
            throw new Error400("Operation failed !");
        return res.status(200).send({ success: true, statusCode: 200 });
    }
    catch (error) {
        next(error);
    }
});
//  get customer reviews in user account
module.exports.getMyReviews = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { _id } = req.decoded;
        const reviews = yield Review.aggregate([
            { $match: { customerId: ObjectId(_id) } },
            {
                $lookup: {
                    from: "orders",
                    localField: "orderId",
                    foreignField: "_id",
                    as: "order",
                },
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [{ $arrayElemAt: ["$order", 0] }, "$$ROOT"],
                    },
                },
            },
            { $unset: ["order"] },
            {
                $sort: { _id: -1 },
            },
        ]);
        return res.status(200).send({ success: true, statusCode: 200, reviews });
    }
    catch (error) {
        next(error);
    }
});
module.exports.getProductDetails = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pid, sku, oid } = req === null || req === void 0 ? void 0 : req.query;
        if (!pid || !sku || !oid)
            return next(new Error400("Required product and sku and order id !"));
        const getOrder = yield ORDER_TABLE.findOne({
            $and: [
                { _id: ObjectId(oid) },
                { productId: ObjectId(pid) },
                { sku: sku },
            ],
        });
        if (!getOrder)
            return next(new Error400("ORDER_TABLE not found !"));
        let product = yield Product.aggregate(product_detail_review_pipe(pid, sku));
        product = product[0];
        return res.status(200).send({
            success: true,
            statusCode: 200,
            response: product,
            message: (getOrder === null || getOrder === void 0 ? void 0 : getOrder.is_rated) ? "You already review this product." : null,
        });
    }
    catch (error) {
        next(error);
    }
});
