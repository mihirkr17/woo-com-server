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
const { update_variation_stock_available, actualSellingPrice, calculateShippingCost } = require("../../services/common.service");
const email_service = require("../../services/email.service");
module.exports = function confirmOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, _uuid } = req.decoded;
            if (!req.body || typeof req.body !== "object") {
                return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
            }
            const { paymentIntentID, paymentMethodID, orderPaymentID, orderItems } = req.body;
            if (!paymentIntentID || !paymentMethodID) {
                return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
            }
            if (!orderItems || !Array.isArray(orderItems) || orderItems.length <= 0) {
                return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
            }
            function confirmOrderHandler(item) {
                var _a, _b, _c;
                return __awaiter(this, void 0, void 0, function* () {
                    if (!item) {
                        return;
                    }
                    const { productID, variationID, listingID, quantity, areaType } = item;
                    if (areaType !== "local" && areaType !== "zonal") {
                        return;
                    }
                    let product;
                    let newProduct = yield Product.aggregate([
                        { $match: { $and: [{ _lid: listingID }, { _id: ObjectId(productID) }] } },
                        { $unwind: { path: "$variations" } },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$variations._vrid', variationID] },
                                        { $eq: ["$variations.stock", "in"] },
                                        { $eq: ["$variations.status", "active"] },
                                        { $gte: ["$variations.available", parseInt(quantity)] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                title: "$variations.vTitle",
                                slug: 1,
                                variations: 1,
                                brand: 1,
                                image: { $first: "$images" },
                                sku: "$variations.sku",
                                shipping: 1,
                                packaged: 1,
                                sellerData: {
                                    sellerID: "$sellerData.sellerID",
                                    storeName: "$sellerData.storeName"
                                },
                                baseAmount: { $multiply: [actualSellingPrice, parseInt(quantity)] },
                                sellingPrice: actualSellingPrice
                            }
                        },
                        {
                            $set: {
                                paymentMode: "card",
                                state: item === null || item === void 0 ? void 0 : item.state,
                                shippingAddress: item === null || item === void 0 ? void 0 : item.shippingAddress,
                                paymentStatus: "success",
                                customerID: _uuid,
                                customerEmail: email,
                                orderStatus: "pending",
                                paymentIntentID: paymentIntentID,
                                paymentMethodID: paymentMethodID,
                                orderPaymentID: orderPaymentID,
                                productID: productID,
                                listingID: listingID,
                                variationID: variationID,
                                quantity: quantity
                            }
                        },
                        {
                            $unset: ["variations"]
                        }
                    ]);
                    product = newProduct[0];
                    product["orderID"] = "oi_" + (Math.floor(10000000 + Math.random() * 999999999999)).toString();
                    product["trackingID"] = "tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString();
                    if (((_a = product === null || product === void 0 ? void 0 : product.shipping) === null || _a === void 0 ? void 0 : _a.isFree) && ((_b = product === null || product === void 0 ? void 0 : product.shipping) === null || _b === void 0 ? void 0 : _b.isFree)) {
                        product["shippingCharge"] = 0;
                    }
                    else {
                        product["shippingCharge"] = calculateShippingCost((_c = product === null || product === void 0 ? void 0 : product.packaged) === null || _c === void 0 ? void 0 : _c.volumetricWeight, areaType);
                    }
                    let amountNew = (product === null || product === void 0 ? void 0 : product.baseAmount) + (product === null || product === void 0 ? void 0 : product.shippingCharge);
                    product["baseAmount"] = parseInt(amountNew);
                    const timestamp = Date.now();
                    product["orderAT"] = {
                        iso: new Date(timestamp),
                        time: new Date(timestamp).toLocaleTimeString(),
                        date: new Date(timestamp).toDateString(),
                        timestamp: timestamp
                    };
                    let result = yield Order.findOneAndUpdate({ user_email: email }, { $push: { orders: product } }, { upsert: true });
                    if (result) {
                        yield update_variation_stock_available("dec", { productID, listingID, variationID, quantity });
                        return {
                            orderConfirmSuccess: true,
                            message: "Order success for " + (product === null || product === void 0 ? void 0 : product.title),
                            orderID: product === null || product === void 0 ? void 0 : product.orderID,
                            baseAmount: item === null || item === void 0 ? void 0 : item.baseAmount,
                            title: product === null || product === void 0 ? void 0 : product.title
                        };
                    }
                });
            }
            const promises = Array.isArray(orderItems) && orderItems.map((orderItem) => __awaiter(this, void 0, void 0, function* () { return yield confirmOrderHandler(orderItem); }));
            let upRes = yield Promise.all(promises);
            let totalAmount = Array.isArray(upRes) &&
                upRes.map((item) => (parseFloat(item === null || item === void 0 ? void 0 : item.baseAmount) + (item === null || item === void 0 ? void 0 : item.shippingCharge))).reduce((p, n) => p + n, 0).toFixed(2);
            const mail = yield email_service({
                to: email,
                subject: "Order confirm",
                html: `<div>
            <ul>
            ${upRes && upRes.map((e) => {
                    return `<li>${e === null || e === void 0 ? void 0 : e.title}</li>`;
                })}
            </ul>
            <b>Total amount = ${totalAmount && totalAmount} $</b>
         </div>`
            });
            if (upRes) {
                return res.status(200).send({ message: "order success", statusCode: 200, success: true, data: upRes });
            }
        }
        catch (error) {
            next(error);
        }
    });
};
