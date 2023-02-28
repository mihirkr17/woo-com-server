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
const response = require("../../errors/apiResponse");
const { findUserByEmail } = require("../../services/common.services");
module.exports = function SinglePurchaseOrder(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const authEmail = req.decoded.email;
            const body = req.body;
            const uuid = req.decoded._UUID;
            if (!body) {
                return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
            }
            const { variationID, productID, quantity, listingID, paymentIntentID, state, paymentMethodID, orderPaymentID, customerEmail } = body;
            let user = yield findUserByEmail(authEmail);
            if (!user) {
                return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
            }
            let defaultShippingAddress = (Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) &&
                ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
            let areaType = defaultShippingAddress === null || defaultShippingAddress === void 0 ? void 0 : defaultShippingAddress.area_type;
            let product = yield Product.aggregate([
                { $match: { $and: [{ _LID: listingID }, { _id: ObjectId(productID) }] } },
                { $unwind: { path: "$variations" } },
                { $match: { $and: [{ 'variations._VID': variationID }] } },
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
                                    { case: { $eq: [areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                                    { case: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                                ],
                                default: "$shipping.delivery.zonalCharge"
                            }
                        },
                        baseAmount: {
                            $add: [{ $multiply: ['$variations.pricing.sellingPrice', parseInt(quantity)] }, {
                                    $switch: {
                                        branches: [
                                            { case: { $eq: [areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                                            { case: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge" }
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
                        state: state,
                        shippingAddress: defaultShippingAddress,
                        paymentStatus: "success",
                        customerID: uuid,
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
            if (product && typeof product !== 'undefined') {
                product = product[0];
                product["customerEmail"] = customerEmail;
                product["orderID"] = "#" + (Math.floor(10000000 + Math.random() * 999999999999)).toString();
                product["trackingID"] = "TRC" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString();
                const timestamp = Date.now();
                product["orderAT"] = {
                    iso: new Date(timestamp),
                    time: new Date(timestamp).toLocaleTimeString(),
                    date: new Date(timestamp).toDateString(),
                    timestamp: timestamp
                };
                let result = yield Order.findOneAndUpdate({ user_email: authEmail }, { $push: { orders: product } }, { upsert: true });
                if (result) {
                    let availableUnits = (parseInt(product === null || product === void 0 ? void 0 : product.totalUnits) - parseInt(quantity)) || 0;
                    const stock = availableUnits <= 0 ? "out" : "in";
                    yield Product.findOneAndUpdate({ _id: ObjectId(productID) }, {
                        $set: {
                            "variations.$[i].available": availableUnits,
                            "variations.$[i].stock": stock
                        }
                    }, { arrayFilters: [{ "i._VID": variationID }] });
                    return res.status(200).send({ success: true, statusCode: 200, message: "Order Success." });
                }
            }
        }
        catch (error) {
            next(error);
        }
    });
};
