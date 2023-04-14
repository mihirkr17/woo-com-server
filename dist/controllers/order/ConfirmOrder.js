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
const { update_variation_stock_available, calculateShippingCost } = require("../../services/common.service");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");
const { generateOrderID, generateTrackingID } = require("../../utils/common");
module.exports = function confirmOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req.decoded;
            if (!req.body || typeof req.body !== "object") {
                return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
            }
            const { paymentIntentID, paymentMethodID, orderPaymentID, orderItems } = req.body;
            if (!req.body || typeof req.body !== "object" || !paymentIntentID || !paymentMethodID || !orderItems || !Array.isArray(orderItems) || orderItems.length <= 0) {
                return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
            }
            function separateOrdersBySeller(upRes) {
                var _a;
                let newOrder = {};
                for (const orderItem of upRes) {
                    const sellerEmail = (_a = orderItem === null || orderItem === void 0 ? void 0 : orderItem.sellerData) === null || _a === void 0 ? void 0 : _a.sellerEmail;
                    if (!newOrder[sellerEmail]) {
                        newOrder[sellerEmail] = [];
                    }
                    newOrder[sellerEmail].push(orderItem);
                }
                return newOrder;
            }
            function confirmOrderHandler(product) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { productID, variationID, listingID, quantity, areaType, shipping, packaged, baseAmount, } = product;
                    const timestamp = Date.now();
                    product["orderID"] = generateOrderID();
                    product["trackingID"] = generateTrackingID();
                    product["orderPaymentID"] = orderPaymentID;
                    product["paymentIntentID"] = paymentIntentID;
                    product["paymentMethodID"] = paymentMethodID;
                    product["paymentStatus"] = "success";
                    product["paymentMode"] = "card";
                    product["shippingCharge"] = (shipping === null || shipping === void 0 ? void 0 : shipping.isFree) ? 0 : calculateShippingCost(packaged === null || packaged === void 0 ? void 0 : packaged.volumetricWeight, areaType);
                    product["baseAmount"] = parseInt(baseAmount + (product === null || product === void 0 ? void 0 : product.shippingCharge));
                    product["orderAT"] = {
                        iso: new Date(timestamp),
                        time: new Date(timestamp).toLocaleTimeString(),
                        date: new Date(timestamp).toDateString(),
                        timestamp: timestamp
                    };
                    const result = yield Order.findOneAndUpdate({ user_email: email }, { $push: { orders: product } }, { upsert: true });
                    if (result) {
                        yield update_variation_stock_available("dec", { productID, listingID, variationID, quantity });
                        return product;
                    }
                });
            }
            const orderPromises = Array.isArray(orderItems) && orderItems.map((orderItem) => __awaiter(this, void 0, void 0, function* () { return yield confirmOrderHandler(orderItem); }));
            const result = yield Promise.all(orderPromises);
            // calculating total amount of order items
            const totalAmount = Array.isArray(result) ?
                result.reduce((p, n) => p + parseInt((n === null || n === void 0 ? void 0 : n.baseAmount) + (n === null || n === void 0 ? void 0 : n.shippingCharge)), 0) : 0;
            // after calculating total amount and order succeed then email sent to the buyer
            yield email_service({
                to: email,
                subject: "Order confirmed",
                html: buyer_order_email_template(result, totalAmount)
            });
            // after order succeed then group the order item by seller email and send email to the seller
            const orderBySeller = (Array.isArray(result) && result.length >= 1) ? separateOrdersBySeller(result) : {};
            // after successfully got order by seller as a object then loop it and trigger send email function inside for in loop
            for (const sellerEmail in orderBySeller) {
                const items = orderBySeller[sellerEmail];
                yield email_service({
                    to: sellerEmail,
                    subject: "New order confirmed",
                    html: seller_order_email_template(items)
                });
            }
            // after order confirmed then return response to the client
            return res.status(200).send({ message: "Order completed.", statusCode: 200, success: true });
        }
        catch (error) {
            next(error);
        }
    });
};
