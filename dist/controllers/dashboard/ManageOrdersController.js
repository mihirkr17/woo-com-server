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
const { order_status_updater, update_variation_stock_available } = require("../../services/common.services");
const Product = require("../../model/product.model");
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
module.exports.orderStatusManagement = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const storeName = req.params.storeName;
        if (!storeName)
            throw new Error("Required store name in param !");
        if (!body)
            throw new Error("Required body information about orders !");
        const { type, customerEmail, productID, variationID, orderID, listingID, trackingID, quantity, cancelReason } = body;
        if (!type || type === "")
            throw new Error("Required status type !");
        if (!customerEmail || customerEmail === "")
            throw new Error("Required customer email !");
        if (!orderID || orderID === "")
            throw new Error("Required Order ID !");
        if (!trackingID || trackingID === "")
            throw new Error("Required Tracking ID !");
        const result = yield order_status_updater({
            type: type,
            customerEmail,
            orderID,
            trackingID,
            cancelReason
        });
        if (result) {
            if (type === "canceled" && cancelReason) {
                yield update_variation_stock_available("inc", { listingID, productID, variationID, quantity });
            }
            return res.status(200).send({ success: true, statusCode: 200, message: "Order status updated to " + type });
        }
    }
    catch (error) {
        next(error);
    }
});
