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
const { startSession } = require("mongoose");
const Product = require("../../model/product.model");
const apiResponse = require("../../errors/apiResponse");
const { findUserByEmail, createPaymentIntents, update_variation_stock_available } = require("../../services/common.service");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");
const Order = require("../../model/order.model");
const { cartContextCalculation } = require("../../utils/common");
const { single_purchase_pipe } = require("../../utils/pipelines");
module.exports = function SinglePurchaseOrder(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield startSession();
        session.startTransaction();
        try {
            const { email, _id } = req.decoded;
            const timestamp = Date.now();
            if (!req.body)
                throw new apiResponse.Api503Error("Service unavailable !");
            const { sku, productId, quantity, session: paymentSessionId, paymentMethodId } = req.body;
            if (!sku || !productId || !quantity || !paymentMethodId)
                throw new apiResponse.Api400Error("Required sku, product id, quantity, paymentMethodId");
            const user = yield findUserByEmail(email);
            if (!user)
                throw new apiResponse.Api503Error("Service unavailable !");
            const defaultAddress = (_a = user === null || user === void 0 ? void 0 : user.shippingAddress) === null || _a === void 0 ? void 0 : _a.find((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true);
            let item = yield Product.aggregate(single_purchase_pipe(productId, sku, quantity));
            if (typeof item === 'undefined' || !Array.isArray(item))
                throw new apiResponse.Api503Error("Service unavailable !");
            const { finalAmount } = cartContextCalculation(item);
            let order = new Order({
                state: "buy",
                customerId: _id,
                shippingAddress: defaultAddress,
                orderStatus: "placed",
                orderPlacedAt: new Date(timestamp),
                paymentMode: "card",
                paymentStatus: "pending",
                items: item,
                totalAmount: finalAmount
            });
            const result = yield order.save();
            const intent = yield createPaymentIntents(finalAmount, result === null || result === void 0 ? void 0 : result._id.toString(), paymentMethodId, paymentSessionId, req === null || req === void 0 ? void 0 : req.ip, req.get("user-agent"));
            // if payment success then change order payment status and save
            if (intent === null || intent === void 0 ? void 0 : intent.id) {
                order.paymentIntentId = intent === null || intent === void 0 ? void 0 : intent.id;
                order.paymentStatus = "paid";
            }
            const [orderResult, updateInventoryResult] = yield Promise.all([
                order.save(),
                update_variation_stock_available("dec", item)
            ]);
            if (!orderResult)
                throw new Api500Error("Internal server error !");
            yield session.commitTransaction();
            session.endSession();
            // after success return the response to the client
            return res.status(200).send({
                success: true,
                statusCode: 200,
                status: intent === null || intent === void 0 ? void 0 : intent.status,
                paymentIntentId: intent === null || intent === void 0 ? void 0 : intent.id,
                clientSecret: intent === null || intent === void 0 ? void 0 : intent.client_secret,
                message: "Payment succeed and order has been placed."
            });
        }
        catch (error) {
            yield session.abortTransaction();
            session.endSession();
            next(error);
        }
    });
};
