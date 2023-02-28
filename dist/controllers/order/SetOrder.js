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
const response = require("../../errors/apiResponse");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const ShoppingCart = require("../../model/shoppingCart.model");
const { findUserByEmail } = require("../../services/common.services");
module.exports = function SetOrder(req, res, next) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userEmail = req.headers.authorization || "";
            const authEmail = req.decoded.email;
            const body = req.body;
            if (userEmail !== authEmail) {
                throw new response.Api401Error("AuthError", "Unauthorized access !");
            }
            if (!body || typeof body === "undefined") {
                throw new response.Api400Error("ClientError", "Required body !");
            }
            let user = yield findUserByEmail(authEmail);
            let defaultAddress = (Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) &&
                ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
            if (!defaultAddress) {
                throw new response.Api400Error("ClientError", "Required shipping address !");
            }
            let areaType = defaultAddress === null || defaultAddress === void 0 ? void 0 : defaultAddress.area_type;
            const orderItems = yield ShoppingCart.aggregate([
                { $match: { customerEmail: authEmail } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'listingID',
                        foreignField: "_LID",
                        as: "main_product"
                    }
                },
                { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
                { $unset: ["main_product"] },
                { $unwind: { path: "$variations" } },
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$variations._VID', '$variationID'] },
                                { $eq: ["$variations.stock", "in"] },
                                { $eq: ["$variations.status", "active"] },
                                { $gt: ["$variations.available", "$quantity"] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        variations: 1,
                        quantity: 1,
                        productID: 1,
                        listingID: 1,
                        variationID: 1,
                        baseAmount: {
                            $add: [
                                { $multiply: ['$variations.pricing.sellingPrice', '$quantity'] },
                                {
                                    $switch: {
                                        branches: [
                                            { case: { $eq: [areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                                            { case: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                                        ],
                                        default: "$shipping.delivery.zonalCharge"
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    $set: {
                        shippingAddress: defaultAddress,
                        areaType: areaType,
                        state: body === null || body === void 0 ? void 0 : body.state
                    }
                },
                { $unset: ["variations"] }
            ]);
            if (!orderItems || orderItems.length <= 0) {
                throw new response.Api400Error("ClientError", "Nothing for purchase ! Please add product in your cart.");
            }
            let totalAmount = Array.isArray(orderItems) &&
                orderItems.map((item) => parseFloat(item === null || item === void 0 ? void 0 : item.baseAmount)).reduce((p, n) => p + n, 0).toFixed(2);
            totalAmount = parseFloat(totalAmount);
            if (!totalAmount) {
                return res.status(402).send();
            }
            // Creating payment intent after getting total amount of order items. 
            const paymentIntent = yield stripe.paymentIntents.create({
                amount: (totalAmount * 100),
                currency: 'bdt',
                payment_method_types: ['card'],
                metadata: {
                    order_id: "OP-" + (Math.round(Math.random() * 99999999) + parseInt(totalAmount)).toString()
                }
            });
            if (!(paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.client_secret)) {
                throw new response.Api400Error("ClientError", "Payment failed.");
            }
            return res.status(200).send({
                success: true,
                statusCode: 200,
                orderItems,
                totalAmount: totalAmount,
                clientSecret: paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.client_secret,
                orderPaymentID: (_c = paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.metadata) === null || _c === void 0 ? void 0 : _c.order_id
            });
        }
        catch (error) {
            next(error);
        }
    });
};
