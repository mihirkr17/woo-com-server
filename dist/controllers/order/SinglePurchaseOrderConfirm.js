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
const apiResponse = require("../../errors/apiResponse");
const { findUserByEmail, update_variation_stock_available, actualSellingPrice, calculateShippingCost } = require("../../services/common.service");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");
module.exports = function SinglePurchaseOrderConfirm(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const authEmail = req.decoded.email;
            const { orderPaymentID, clientSecret, paymentIntentID, paymentMethodID, orderID, customerEmail, productID, variationID, quantity, listingID, baseAmount, sellerData } = req.body;
            if (!orderPaymentID || !clientSecret || !paymentIntentID || !paymentMethodID || !orderID)
                throw new apiResponse.Api400Error(`Required order payment id, client secret, payment intent id, payment method id & order id !`);
            const result = yield Order.findOneAndUpdate({ user_email: customerEmail }, {
                $set: {
                    "orders.$[i].paymentStatus": "success",
                    "orders.$[i].paymentMethodID": paymentMethodID
                }
            }, { arrayFilters: [{ "i.orderID": orderID }] });
            if (result) {
                yield update_variation_stock_available("dec", { variationID, productID, quantity, listingID });
                authEmail && (yield email_service({
                    to: authEmail,
                    subject: "Order confirmed",
                    html: buyer_order_email_template(req.body, baseAmount)
                }));
                (sellerData === null || sellerData === void 0 ? void 0 : sellerData.sellerEmail) && (yield email_service({
                    to: sellerData === null || sellerData === void 0 ? void 0 : sellerData.sellerEmail,
                    subject: "New order confirmed",
                    html: seller_order_email_template([req.body])
                }));
                return res.status(200).send({ success: true, statusCode: 200, message: "Order Success." });
            }
        }
        catch (error) {
            next(error);
        }
    });
};
