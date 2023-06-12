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
const { update_variation_stock_available, clearCart } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const Order = require("../../model/order.model");
const NCache = require("../../utils/NodeCache");
module.exports = function confirmOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req.decoded;
            const { paymentMethodID, orderPaymentID, productInfos, orderState, orderIDs, paymentIntentID, clientSecret } = req.body;
            if (!req.body || typeof req.body !== "object" || !orderPaymentID || !productInfos)
                throw new apiResponse.Api503Error("Service unavailable !");
            yield Order.updateMany({ $and: [{ orderID: orderIDs }] }, {
                $set: {
                    "payment.method_id": paymentMethodID,
                    "payment.intent_id": paymentIntentID,
                    "payment.client_secret": clientSecret,
                    "payment.status": "paid"
                }
            }, {});
            yield NCache.deleteCache(`${email}_myOrders`);
            if (paymentMethodID && clientSecret && productInfos) {
                const orderPromises = productInfos.map((item) => __awaiter(this, void 0, void 0, function* () {
                    return yield update_variation_stock_available("dec", {
                        productID: item === null || item === void 0 ? void 0 : item.productID,
                        listingID: item === null || item === void 0 ? void 0 : item.listingID,
                        variationID: item === null || item === void 0 ? void 0 : item.variationID,
                        quantity: item === null || item === void 0 ? void 0 : item.quantity
                    });
                }));
                const result = yield Promise.all(orderPromises);
                if (result && orderState === "byCart") {
                    yield clearCart(email);
                }
                // after order confirmed then return response to the client
                return res.status(200).send({ message: "Order completed.", statusCode: 200, success: true });
            }
        }
        catch (error) {
            next(error);
        }
    });
};
