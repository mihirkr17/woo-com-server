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
module.exports = function RetrievePaymentMethod(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const txID = req.params.txID;
            const paymentMethod = yield stripe.paymentIntents.retrieve(txID);
            return res.status(200).send(paymentMethod);
        }
        catch (error) {
            next(error);
        }
    });
};
