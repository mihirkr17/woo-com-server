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
module.exports = function setOrderHandler(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userEmail = req.headers.authorization || "";
            const verifiedEmail = req.decoded.email;
            const customerUUID = req.decoded._UUID;
            const body = req.body;
            if (userEmail !== verifiedEmail) {
                return res.status(401).send({ success: false, statusCode: 401, message: "Unauthorized access" });
            }
            if (!body || typeof body === "undefined") {
                return res.status(400).send({
                    success: false,
                    statusCode: 400,
                    error: "Something went wrong !",
                });
            }
            function setOrder(item) {
                return __awaiter(this, void 0, void 0, function* () {
                    let productInventor;
                    productInventor = yield Product.aggregate([
                        { $match: { $and: [{ _LID: item === null || item === void 0 ? void 0 : item.listingID }, { _id: ObjectId(item === null || item === void 0 ? void 0 : item.productID) }] } },
                        { $unwind: { path: "$variations" } },
                        { $replaceRoot: { newRoot: { $mergeObjects: ["$variations", "$$ROOT"] } } },
                        { $unset: ["variations"] },
                        { $match: { $and: [{ _VID: item === null || item === void 0 ? void 0 : item.variationID }] } },
                        {
                            $project: {
                                vr: {
                                    $cond: {
                                        if: { $gte: ["$available", item === null || item === void 0 ? void 0 : item.quantity] }, then: "yes", else: "no"
                                    },
                                },
                                available: 1,
                                sellingPrice: "$pricing.sellingPrice",
                                totalAmount: {
                                    $add: [
                                        { $multiply: ['$pricing.sellingPrice', parseInt(item === null || item === void 0 ? void 0 : item.quantity)] },
                                        {
                                            $switch: {
                                                branches: [
                                                    { case: { $eq: [item.shippingAddress.area_type, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                                                    { case: { $eq: [item.shippingAddress.area_type, "local"] }, then: "$shipping.delivery.localCharge" }
                                                ],
                                                default: "$shipping.delivery.zonalCharge"
                                            }
                                        }
                                    ]
                                },
                                sellerData: 1,
                                shippingCharge: {
                                    $switch: {
                                        branches: [
                                            { case: { $eq: [item.shippingAddress.area_type, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                                            { case: { $eq: [item.shippingAddress.area_type, "local"] }, then: "$shipping.delivery.localCharge" }
                                        ],
                                        default: "$shipping.delivery.zonalCharge"
                                    }
                                },
                            }
                        }
                    ]);
                    productInventor = productInventor[0];
                    if (productInventor && (productInventor === null || productInventor === void 0 ? void 0 : productInventor.vr) === "yes") {
                        item["shippingCharge"] = productInventor === null || productInventor === void 0 ? void 0 : productInventor.shippingCharge;
                        item["totalAmount"] = productInventor === null || productInventor === void 0 ? void 0 : productInventor.totalAmount;
                        item["sellerData"] = productInventor === null || productInventor === void 0 ? void 0 : productInventor.sellerData;
                        item["sellingPrice"] = productInventor === null || productInventor === void 0 ? void 0 : productInventor.sellingPrice;
                        item["orderID"] = "#" + (Math.round(Math.random() * 999999999) + (productInventor === null || productInventor === void 0 ? void 0 : productInventor.available)).toString();
                        item["trackingID"] = "TRC" + (Math.round(Math.random() * 9999999)).toString();
                        const timestamp = Date.now();
                        item["orderAT"] = {
                            iso: new Date(timestamp),
                            time: new Date(timestamp).toLocaleTimeString(),
                            date: new Date(timestamp).toDateString(),
                            timestamp: timestamp
                        };
                        item["customerID"] = customerUUID;
                        item["orderStatus"] = "pending";
                        let result = yield Order.findOneAndUpdate({ user_email: userEmail }, { $push: { orders: item } }, { upsert: true });
                        if (result) {
                            let availableProduct = productInventor === null || productInventor === void 0 ? void 0 : productInventor.available;
                            let restAvailable = availableProduct - (item === null || item === void 0 ? void 0 : item.quantity);
                            let stock = restAvailable <= 1 ? "out" : "in";
                            yield Product.findOneAndUpdate({ _id: ObjectId(item === null || item === void 0 ? void 0 : item.productID) }, {
                                $set: {
                                    "variations.$[i].available": restAvailable,
                                    "variations.$[i].stock": stock
                                }
                            }, { arrayFilters: [{ "i._VID": item === null || item === void 0 ? void 0 : item.variationID }] });
                            return { orderSuccess: true, message: "Order success for " + (item === null || item === void 0 ? void 0 : item.title) };
                        }
                    }
                    else {
                        return { orderSuccess: false, message: "Sorry, Order failed for " + (item === null || item === void 0 ? void 0 : item.title) + " due to quantity greater than total units !" };
                    }
                });
            }
            const promises = Array.isArray(body) && body.map((b) => __awaiter(this, void 0, void 0, function* () {
                return yield setOrder(b);
            }));
            let finalResult = yield Promise.all(promises);
            return res.status(200).send({ success: true, statusCode: 200, data: finalResult });
        }
        catch (error) {
            next(error);
        }
    });
};
