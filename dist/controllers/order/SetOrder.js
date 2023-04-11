"use strict";
// src/controllers/order/SetOrder.tsx
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
const apiResponse = require("../../errors/apiResponse");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const ShoppingCart = require("../../model/shoppingCart.model");
const { findUserByEmail, actualSellingPrice, calculateShippingCost, update_variation_stock_available } = require("../../services/common.service");
const Order = require("../../model/order.model");
const email_service = require("../../services/email.service");
module.exports = function SetOrder(req, res, next) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userEmail = req.headers.authorization || "";
            const { email: authEmail, _uuid } = req.decoded;
            if (userEmail !== authEmail) {
                throw new apiResponse.Api401Error("Unauthorized access !");
            }
            if (!req.body || typeof req.body === "undefined") {
                throw new apiResponse.Api400Error("Required body !");
            }
            const { state } = req.body;
            let user = yield findUserByEmail(authEmail);
            let defaultAddress = (Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) &&
                ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
            if (!defaultAddress) {
                throw new apiResponse.Api400Error("Required shipping address !");
            }
            let areaType = defaultAddress === null || defaultAddress === void 0 ? void 0 : defaultAddress.area_type;
            const orderItems = yield ShoppingCart.aggregate([
                { $match: { customerEmail: authEmail } },
                { $unwind: { path: "$items" } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.listingID',
                        foreignField: "_lid",
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
                                { $eq: ['$variations._vrid', '$items.variationID'] },
                                { $eq: ["$variations.stock", "in"] },
                                { $eq: ["$variations.status", "active"] },
                                { $gte: ["$variations.available", "$items.quantity"] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        variations: 1,
                        quantity: "$items.quantity",
                        shipping: 1,
                        productID: "$items.productID",
                        packaged: 1,
                        listingID: "$items.listingID",
                        variationID: "$items.variationID",
                        image: { $first: "$images" },
                        title: "$variations.vTitle",
                        slug: 1,
                        brand: 1,
                        sellerData: {
                            sellerEmail: '$sellerData.sellerEmail',
                            sellerID: "$sellerData.sellerID",
                            storeName: "$sellerData.storeName"
                        },
                        sku: "$variations.sku",
                        baseAmount: { $multiply: [actualSellingPrice, '$items.quantity'] },
                        sellingPrice: actualSellingPrice
                    }
                },
                {
                    $set: {
                        customerEmail: authEmail,
                        customerID: _uuid,
                        shippingAddress: defaultAddress,
                        areaType: areaType,
                        state: state
                    }
                },
                { $unset: ["variations", "items"] }
            ]);
            if (!orderItems || orderItems.length <= 0) {
                throw new apiResponse.Api400Error("Nothing for purchase ! Please add product in your cart.");
            }
            orderItems && orderItems.map((p) => {
                var _a, _b, _c;
                if (((_a = p === null || p === void 0 ? void 0 : p.shipping) === null || _a === void 0 ? void 0 : _a.isFree) && ((_b = p === null || p === void 0 ? void 0 : p.shipping) === null || _b === void 0 ? void 0 : _b.isFree)) {
                    p["shippingCharge"] = 0;
                }
                else {
                    p["shippingCharge"] = calculateShippingCost((_c = p === null || p === void 0 ? void 0 : p.packaged) === null || _c === void 0 ? void 0 : _c.volumetricWeight, areaType);
                }
                return p;
            });
            let totalAmount = Array.isArray(orderItems) &&
                orderItems.map((item) => (parseFloat(item === null || item === void 0 ? void 0 : item.baseAmount) + (item === null || item === void 0 ? void 0 : item.shippingCharge))).reduce((p, n) => p + n, 0).toFixed(2);
            totalAmount = parseFloat(totalAmount);
            if (!totalAmount) {
                return res.status(402).send();
            }
            // Creating payment intent after getting total amount of order items. 
            const paymentIntent = yield stripe.paymentIntents.create({
                amount: (totalAmount * 100),
                currency: 'usd',
                payment_method_types: ['card'],
                metadata: {
                    order_id: "opi_" + (Math.round(Math.random() * 99999999) + parseInt(totalAmount)).toString()
                }
            });
            if (!(paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.client_secret)) {
                throw new apiResponse.Api400Error("Payment failed.");
            }
            return res.status(200).send({
                success: true,
                statusCode: 200,
                orderItems,
                totalAmount: totalAmount,
                message: "Order confirming soon..",
                clientSecret: paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.client_secret,
                orderPaymentID: (_c = paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.metadata) === null || _c === void 0 ? void 0 : _c.order_id
            });
        }
        catch (error) {
            next(error);
        }
    });
};
