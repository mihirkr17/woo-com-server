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
const Order = require("../../model/order.model");
const { order_status_updater } = require("../../services/common.services");
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");
module.exports.manageOrders = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const view = ((_a = req.query) === null || _a === void 0 ? void 0 : _a.view) || "";
        const storeName = req.params.storeName;
        const uuid = req.decoded._UUID;
        let result;
        if (storeName) {
            if (view === "group") {
                result = yield Order.aggregate([
                    { $unwind: "$orders" },
                    { $replaceRoot: { newRoot: "$orders" } },
                    {
                        $lookup: {
                            from: 'products',
                            localField: 'listingID',
                            foreignField: "_LID",
                            as: "main_product"
                        }
                    },
                    { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
                    {
                        $match: {
                            $and: [{ "sellerData.storeName": storeName }, { "sellerData.sellerID": uuid }],
                        },
                    },
                    {
                        $unset: [
                            'bodyInfo', 'main_product',
                            "modifiedAt", "paymentInfo",
                            "variations", "_id", "tax", "save_as", "reviews",
                            "ratingAverage", "_LID", "specification", "rating", "isVerified", "createdAt", "categories"
                        ]
                    }, {
                        $group: {
                            _id: "$orderPaymentID",
                            orders: {
                                $push: "$$ROOT"
                            }
                        }
                    }, {
                        $addFields: {
                            totalOrderAmount: { $sum: "$orders.baseAmount" }
                        }
                    }
                ]);
            }
            else {
                result = yield Order.aggregate([
                    { $unwind: "$orders" },
                    { $replaceRoot: { newRoot: "$orders" } },
                    {
                        $lookup: {
                            from: 'products',
                            localField: 'listingID',
                            foreignField: "_LID",
                            as: "main_product"
                        }
                    },
                    { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
                    {
                        $match: {
                            $and: [{ "sellerData.storeName": storeName }, { "sellerData.sellerID": uuid }],
                        },
                    },
                    {
                        $unset: [
                            'bodyInfo', 'main_product',
                            "modifiedAt", "paymentInfo",
                            "variations", "_id", "tax", "save_as", "reviews",
                            "ratingAverage", "_LID", "specification", "rating", "isVerified", "createdAt", "categories"
                        ]
                    }
                ]);
            }
        }
        ;
        let newOrderCount = result && result.filter((o) => (o === null || o === void 0 ? void 0 : o.orderStatus) === "pending").length;
        let totalOrderCount = result && result.length;
        return res.status(200).send({ success: true, statusCode: 200, data: { module: result, newOrderCount, totalOrderCount } });
    }
    catch (error) {
        next(error);
    }
});
module.exports.dispatchOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const body = req.body;
        if (((_b = body === null || body === void 0 ? void 0 : body.context) === null || _b === void 0 ? void 0 : _b.MARKET_PLACE) !== "WooKart") {
            throw new Error("Invalid operation !");
        }
        if (!(body === null || body === void 0 ? void 0 : body.module)) {
            throw new Error("Invalid operation !");
        }
        const { trackingID, orderID, customerEmail } = body && (body === null || body === void 0 ? void 0 : body.module);
        const result = yield order_status_updater({
            type: "dispatch",
            customerEmail,
            orderID,
            trackingID
        });
        return ((result === null || result === void 0 ? void 0 : result.success) && (result === null || result === void 0 ? void 0 : result.success)) ?
            res.status(200).send({ success: true, statusCode: 200, message: "Successfully order dispatched" }) :
            res.status(500).send({ success: false, statusCode: 500, message: "failed to update" });
    }
    catch (error) {
        next(error);
    }
});
module.exports.orderStatusManagement = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        if (!body)
            throw new Error("Required body information about orders !");
        const { type, customerEmail, productID, variationID, orderID, listingID, trackingID, quantity, cancelReason } = body;
        const result = yield order_status_updater({
            type: type,
            customerEmail,
            orderID,
            trackingID,
            cancelReason
        });
        if (result) {
            if (type === "canceled" && cancelReason) {
                let product = yield Product.aggregate([
                    { $match: { $and: [{ _LID: listingID }, { _id: ObjectId(productID) }] } },
                    { $unwind: { path: "$variations" } },
                    {
                        $project: {
                            variations: 1
                        }
                    },
                    { $match: { $and: [{ "variations._VID": variationID }] } },
                    {
                        $project: {
                            available: "$variations.available"
                        }
                    }
                ]);
                product = product[0];
                let availableProduct = parseInt(product === null || product === void 0 ? void 0 : product.available);
                let restAvailable = availableProduct + parseInt(quantity);
                let stock = restAvailable <= 0 ? "out" : "in";
                yield Product.findOneAndUpdate({ $and: [{ _LID: listingID }, { _id: ObjectId(productID) }] }, {
                    $set: {
                        "variations.$[i].available": restAvailable,
                        "variations.$[i].stock": stock
                    }
                }, { arrayFilters: [{ "i._VID": variationID }] });
            }
            return res.status(200).send({ success: true, statusCode: 200, message: "Order status updated to " + type });
        }
    }
    catch (error) {
        next(error);
    }
});
