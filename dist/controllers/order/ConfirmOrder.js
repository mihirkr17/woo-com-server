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
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");
module.exports = function confirmOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            if (!body || typeof body !== "object") {
                return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
            }
            const { paymentIntentID, paymentMethodID, orderPaymentID, orderItems } = body;
            const email = req.decoded.email;
            const uuid = req.decoded._UUID;
            if (!paymentIntentID || !paymentMethodID) {
                return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
            }
            if (!orderItems || !Array.isArray(orderItems) || orderItems.length <= 0) {
                return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
            }
            function confirmOrderHandler(item) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!item) {
                        return;
                    }
                    if ((item === null || item === void 0 ? void 0 : item.areaType) !== "local" && (item === null || item === void 0 ? void 0 : item.areaType) !== "zonal") {
                        return;
                    }
                    let product;
                    let newProduct = yield Product.aggregate([
                        { $match: { $and: [{ _LID: item === null || item === void 0 ? void 0 : item.listingID }, { _id: ObjectId(item === null || item === void 0 ? void 0 : item.productID) }] } },
                        { $unwind: { path: "$variations" } },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$variations._VID', item === null || item === void 0 ? void 0 : item.variationID] },
                                        { $eq: ["$variations.stock", "in"] },
                                        { $eq: ["$variations.status", "active"] },
                                        { $gte: ["$variations.available", parseInt(item === null || item === void 0 ? void 0 : item.quantity)] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                title: 1,
                                slug: 1,
                                variations: 1,
                                brand: 1,
                                image: { $first: "$variations.images" },
                                sku: "$variations.sku",
                                sellerData: {
                                    sellerID: "$sellerData.sellerID",
                                    storeName: "$sellerData.storeName"
                                },
                                shippingCharge: {
                                    $switch: {
                                        branches: [
                                            { case: { $eq: [item === null || item === void 0 ? void 0 : item.areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                                            { case: { $eq: [item === null || item === void 0 ? void 0 : item.areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                                        ],
                                        default: "$shipping.delivery.zonalCharge"
                                    }
                                },
                                baseAmount: {
                                    $add: [{ $multiply: ['$variations.pricing.sellingPrice', parseInt(item === null || item === void 0 ? void 0 : item.quantity)] }, {
                                            $switch: {
                                                branches: [
                                                    { case: { $eq: [item === null || item === void 0 ? void 0 : item.areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                                                    { case: { $eq: [item === null || item === void 0 ? void 0 : item.areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                                                ],
                                                default: "$shipping.delivery.zonalCharge"
                                            }
                                        }]
                                },
                                sellingPrice: "$variations.pricing.sellingPrice",
                                variant: "$variations.variant",
                                totalUnits: "$variations.available"
                            }
                        },
                        {
                            $set: {
                                paymentMode: "card",
                                state: item === null || item === void 0 ? void 0 : item.state,
                                shippingAddress: item === null || item === void 0 ? void 0 : item.shippingAddress,
                                paymentStatus: "success",
                                customerID: uuid,
                                customerEmail: email,
                                orderStatus: "pending",
                                paymentIntentID: paymentIntentID,
                                paymentMethodID: paymentMethodID,
                                orderPaymentID: orderPaymentID,
                                productID: item === null || item === void 0 ? void 0 : item.productID,
                                listingID: item === null || item === void 0 ? void 0 : item.listingID,
                                variationID: item === null || item === void 0 ? void 0 : item.variationID,
                                quantity: item === null || item === void 0 ? void 0 : item.quantity
                            }
                        },
                        {
                            $unset: ["variations"]
                        }
                    ]);
                    product = newProduct[0];
                    product["orderID"] = "#" + (Math.floor(10000000 + Math.random() * 999999999999)).toString();
                    product["trackingID"] = "TRC" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString();
                    const timestamp = Date.now();
                    product["orderAT"] = {
                        iso: new Date(timestamp),
                        time: new Date(timestamp).toLocaleTimeString(),
                        date: new Date(timestamp).toDateString(),
                        timestamp: timestamp
                    };
                    let result = yield Order.findOneAndUpdate({ user_email: email }, { $push: { orders: product } }, { upsert: true });
                    if (result) {
                        let availableUnits = (parseInt(product === null || product === void 0 ? void 0 : product.totalUnits) - parseInt(item === null || item === void 0 ? void 0 : item.quantity)) || 0;
                        const stock = availableUnits <= 0 ? "out" : "in";
                        yield Product.findOneAndUpdate({ _id: ObjectId(product === null || product === void 0 ? void 0 : product.productID) }, {
                            $set: {
                                "variations.$[i].available": availableUnits,
                                "variations.$[i].stock": stock
                            }
                        }, { arrayFilters: [{ "i._VID": product === null || product === void 0 ? void 0 : product.variationID }] });
                        return {
                            orderConfirmSuccess: true,
                            message: "Order success for " + (product === null || product === void 0 ? void 0 : product.title),
                            orderID: product === null || product === void 0 ? void 0 : product.orderID,
                            baseAmount: item === null || item === void 0 ? void 0 : item.baseAmount
                        };
                    }
                });
            }
            const promises = Array.isArray(orderItems) && orderItems.map((orderItem) => __awaiter(this, void 0, void 0, function* () { return yield confirmOrderHandler(orderItem); }));
            let upRes = yield Promise.all(promises);
            if (upRes) {
                return res.status(200).send({ message: "order success", statusCode: 200, success: true, data: upRes });
            }
        }
        catch (error) {
            next(error);
        }
    });
};
