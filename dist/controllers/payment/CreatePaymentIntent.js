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
module.exports = function CreatePaymentIntent(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            if (!body) {
                return res.status(400).send({ success: false, statusCode: 400, message: "Required body !" });
            }
            const { totalAmount } = body;
            if (!totalAmount || typeof totalAmount === 'undefined') {
                return res.status(400).send({ success: false, statusCode: 400, message: "Required total amount !" });
            }
            const paymentIntent = yield stripe.paymentIntents.create({
                amount: (parseInt(totalAmount) * 100),
                currency: 'bdt',
                payment_method_types: ['card'],
                metadata: {
                    order_id: "OP-" + (Math.round(Math.random() * 99999999) + parseInt(totalAmount)).toString()
                }
            });
            return res.status(200).send({
                clientSecret: paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.client_secret,
                orderPaymentID: (_a = paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.order_id,
                finalAmount: totalAmount
            });
        }
        catch (error) {
            next(error);
        }
    });
};
