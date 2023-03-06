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
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { order_status_updater } = require("../../services/common.services");
module.exports = function RefundPayment(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const { chargeID, reason, amount, orderID, customerEmail, trackingID } = body;
            if (!chargeID)
                throw new Error("Required charge ID !");
            if (!orderID)
                throw new Error("Required Order ID !");
            if (amount && typeof amount !== "number")
                throw new Error("Amount should be number");
            const refund = yield stripe.refunds.create({
                charge: chargeID,
                amount: parseInt(amount) * 100,
                reason: reason
            });
            if (refund) {
                yield order_status_updater({ type: "refunded", orderID, customerEmail, trackingID, refundAT: refund === null || refund === void 0 ? void 0 : refund.created });
                return res.status(200).send({ success: true, statusCode: 200, data: refund });
            }
        }
        catch (error) {
            next(error);
        }
    });
};
