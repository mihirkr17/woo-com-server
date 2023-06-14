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
const Product = require("../../model/product.model");
const Order = require("../../model/order.model");
const Review = require("../../model/reviews.model");
const { Api400Error, Api401Error } = require("../../errors/apiResponse");
const { get_review_product_details_pipe } = require("../../utils/pipelines");
// adding product review and ratings
module.exports.addProductRating = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { _uuid } = req.decoded;
        const { orderID, productID, ratingWeight, description, name, reviewImage } = req === null || req === void 0 ? void 0 : req.body;
        const [updatedProduct, newReview, orderUpdateResult] = yield Promise.all([
            Product.findOneAndUpdate({ _id: ObjectId(productID) }, [
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
                                            "$$rat.count"
                                        ]
                                    }
                                }
                            }
                        },
                        ratingAverage: {
                            $round: [{
                                    $divide: [
                                        {
                                            $reduce: {
                                                input: "$rating",
                                                initialValue: 0,
                                                in: {
                                                    $add: [
                                                        "$$value",
                                                        { $multiply: ["$$this.weight", "$$this.count"] }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            $reduce: {
                                                input: "$rating",
                                                initialValue: 0,
                                                in: { $add: ["$$value", "$$this.count"] }
                                            }
                                        }
                                    ]
                                }, 1
                            ]
                        }
                    }
                }
            ], { new: true }),
            description && new Review({
                product_id: productID,
                order_id: orderID,
                name,
                customer_id: _uuid,
                product_images: (_a = reviewImage.slice(0, 5)) !== null && _a !== void 0 ? _a : [],
                comments: description,
                rating_point: parseInt(ratingWeight),
                verified_purchase: true,
                likes: [],
                review_at: new Date(Date.now())
            }).save(),
            Order.findOneAndUpdate({ order_id: orderID }, {
                $set: {
                    is_rated: true,
                }
            }, { upsert: true })
        ]);
        return res.status(200).send({ success: true, statusCode: 200, message: "Thanks for your review !" });
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
        const { productID } = req.params;
        let { page, sort } = req.query;
        if (!productID)
            throw new Api400Error("Required product id !");
        page = page && parseInt(page);
        page = typeof page === "number" && page === 1 ? 0 : page - 1;
        let sortFilter = sort === "asc" ? { rating_point: 1 } : sort === "dsc" ? { rating_point: -1 } : { _id: -1 };
        const result = (_b = yield Review.find({ product_id: ObjectId(productID) }).sort(sortFilter).skip(page * 2).limit(2)) !== null && _b !== void 0 ? _b : [];
        const reviewCount = (_c = yield Review.countDocuments({ product_id: ObjectId(productID) })) !== null && _c !== void 0 ? _c : 0;
        res.status(200).send({ success: true, statusCode: 200, reviews: result, reviewCount });
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
            throw new Api400Error("Required review id from body !");
        // find one review by review id;
        const review = yield Review.findOne({ _id: ObjectId(reviewID) });
        if (!review)
            throw new Api400Error("Review not found !");
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
            throw new Api400Error("Operation failed !");
        return res.status(200).send({ success: true, statusCode: 200 });
    }
    catch (error) {
        next(error);
    }
});
//  get customer reviews in user account
module.exports.getMyReviews = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { _uuid } = req.decoded;
        const { uuid } = req.params;
        if (_uuid !== uuid)
            return next(new Api401Error("Unauthorized access !"));
        const reviews = yield Review.aggregate([
            { $match: { customer_id: uuid } },
            {
                $lookup: {
                    from: 'order_table',
                    localField: 'order_id',
                    foreignField: 'orderID',
                    as: 'order'
                }
            },
            { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$order", 0] }, "$$ROOT"] } } },
            { $unset: ["order"] },
            {
                $set: {
                    item: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$items",
                                    as: "item",
                                    cond: { $eq: ["$$item.itemID", "$order_item_id"] }
                                }
                            },
                            0
                        ]
                    }
                }
            }, {
                $unset: ["items"]
            }, {
                $sort: { _id: -1 }
            }
        ]);
        return res.status(200).send({ success: true, statusCode: 200, reviews });
    }
    catch (error) {
        next(error);
    }
});
module.exports.getProductDetails = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pid, vid, oid } = req === null || req === void 0 ? void 0 : req.query;
        if (!pid || !vid || !oid)
            return next(new Api400Error("Required product and variation id and order id !"));
        const getOrder = yield Order.findOne({
            $and: [
                { order_id: oid },
                { "product.product_id": pid },
                { "product.variation_id": vid }
            ]
        });
        if (!getOrder)
            return next(new Api400Error("Order not found !"));
        let product = yield Product.aggregate(get_review_product_details_pipe(pid, vid));
        product = product[0];
        return res.status(200).send({ success: true, statusCode: 200, response: product, message: (getOrder === null || getOrder === void 0 ? void 0 : getOrder.is_rated) ? "You already review this product." : null });
    }
    catch (error) {
        next(error);
    }
});
