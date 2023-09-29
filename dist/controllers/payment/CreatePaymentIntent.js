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
const { Api400Error } = require("../../errors/apiResponse");
module.exports = function CreatePaymentIntent(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            if (!body) {
                throw new Api400Error({ success: false, statusCode: 400, message: "Required body !" });
            }
            const { totalAmount, session, paymentMethodId, productIds } = body;
            if (!session)
                throw new Api400Error({ success: false, statusCode: 400, message: "Required session id !" });
            if (!totalAmount || typeof totalAmount === 'undefined') {
                throw new Api400Error({ success: false, statusCode: 400, message: "Required total amount !" });
            }
            const paymentIntent = yield stripe.paymentIntents.create({
                amount: (parseInt(totalAmount) * 100),
                currency: 'bdt',
                metadata: {
                    order_id: productIds
                },
                confirm: true,
                automatic_payment_methods: { enabled: true },
                payment_method: paymentMethodId,
                return_url: 'https://example.com/order/123/complete',
                use_stripe_sdk: true,
                mandate_data: {
                    customer_acceptance: {
                        type: "online",
                        online: {
                            ip_address: req.ip,
                            user_agent: req.get("user-agent"),
                        },
                    },
                },
            }, { idempotencyKey: session });
            return res.status(200).send({
                success: true,
                statusCode: 200,
                status: paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.status,
                paymentIntentId: paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.id,
                clientSecret: paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.client_secret
            });
        }
        catch (error) {
            next(error);
        }
    });
};
