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
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cryPto = require("crypto");
module.exports.generateItemID = () => (Math.floor(10000000 + Math.random() * 999999999999));
module.exports.generateTrackingID = () => ("tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString());
module.exports.generateOrderID = () => ("oi_" + cryPto.randomBytes(16).toString('hex'));
module.exports.transferMoneyToSeller = (intentID, sellerStripeID) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transfer = yield stripe.transfer.create(intentID, {
            amount: 900,
            currency: 'usd',
            destination: sellerStripeID
        });
    }
    catch (error) {
    }
});
