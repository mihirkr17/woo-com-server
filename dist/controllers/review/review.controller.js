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
const OrderTable = require("../../model/orderTable.model");
const Review = require("../../model/reviews.model");
module.exports.addProductRating = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { _uuid } = req.decoded;
        const { orderID, itemID, productID, ratingWeight, productReview, name } = req === null || req === void 0 ? void 0 : req.body;
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
            new Review({
                productID,
                orderID,
                name,
                customerID: _uuid,
                orderItemID: itemID,
                product_review: productReview,
                rating_point: parseInt(ratingWeight)
            }).save(),
            OrderTable.findOneAndUpdate({ orderID }, {
                $set: {
                    "items.$[i].isRated": true,
                },
            }, { arrayFilters: [{ "i.itemID": itemID }], upsert: true })
        ]);
        return res.status(200).send({ success: true, statusCode: 200, message: "Thanks for your review !" });
    }
    catch (error) {
        next(error);
    }
});
