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
            function confirmOrderHandler(product) {
                var _a, _b, _c, _d, _e, _f;
                return __awaiter(this, void 0, void 0, function* () {
                    if (!product) {
                        return;
                    }
                    const { productID, variationID, listingID, quantity, areaType } = product;
                    if (areaType !== "local" && areaType !== "zonal") {
                        return;
                    }
                    product["orderID"] = "oi_" + (Math.floor(10000000 + Math.random() * 999999999999)).toString();
                    product["trackingID"] = "tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString();
                    product["orderPaymentID"] = orderPaymentID;
                    product["paymentIntentID"] = paymentIntentID;
                    product["paymentMethodID"] = paymentMethodID;
                    product["paymentStatus"] = "success";
                    product["paymentMode"] = "card";
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
                        yield email_service({
                            to: (_d = product === null || product === void 0 ? void 0 : product.sellerData) === null || _d === void 0 ? void 0 : _d.sellerEmail,
                            subject: "New order",
                            html: `<div>
                     <h3>You have new order from ${product === null || product === void 0 ? void 0 : product.customerEmail}</h3>
                     <p>
                        <pre>
                           Item Name     : ${product === null || product === void 0 ? void 0 : product.title} <br />
                           Item SKU      : ${product === null || product === void 0 ? void 0 : product.sku} <br />
                           Item Quantity : ${product === null || product === void 0 ? void 0 : product.quantity} <br />
                           Item Price    : ${product === null || product === void 0 ? void 0 : product.baseAmount} usd
                        </pre>
                     </p>
                     <br />
                     <span>Order ID: <b>${product === null || product === void 0 ? void 0 : product.orderID}</b></span> <br />
                     <i>Order At ${(_e = product === null || product === void 0 ? void 0 : product.orderAT) === null || _e === void 0 ? void 0 : _e.time}, ${(_f = product === null || product === void 0 ? void 0 : product.orderAT) === null || _f === void 0 ? void 0 : _f.date}</i>
                  </div>`
                        });
                        return {
                            orderConfirmSuccess: true,
                            message: "Order success for " + (product === null || product === void 0 ? void 0 : product.title),
                            orderID: product === null || product === void 0 ? void 0 : product.orderID,
                            baseAmount: product === null || product === void 0 ? void 0 : product.baseAmount,
                            title: product === null || product === void 0 ? void 0 : product.title
                        };
                    }
                });
            }
            const promises = Array.isArray(orderItems) && orderItems.map((orderItem) => __awaiter(this, void 0, void 0, function* () { return yield confirmOrderHandler(orderItem); }));
            let upRes = yield Promise.all(promises);
            let totalAmount = Array.isArray(upRes) &&
                upRes.map((item) => (parseFloat(item === null || item === void 0 ? void 0 : item.baseAmount) + (item === null || item === void 0 ? void 0 : item.shippingCharge))).reduce((p, n) => p + n, 0).toFixed(2);
            yield email_service({
                to: email,
                subject: "Order confirmed",
                html: `<div>
            <ul>
                  ${upRes && upRes.map((e) => {
                    return `<li>${e === null || e === void 0 ? void 0 : e.title}</li>`;
                })}
            </ul>
            <br />
            <b>Total amount: ${totalAmount && totalAmount} usd</b>
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
