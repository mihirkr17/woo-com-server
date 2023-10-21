"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT } = require("../middlewares/auth.middleware");
const { refundPayment, retrievePaymentIntent, createPaymentIntent, } = require("../controllers/payment.controller");
try {
    router.post("/create-payment-intent", verifyJWT, createPaymentIntent);
    router.post("/refund", verifyJWT, refundPayment);
    router.get("/retrieve-payment-intent/:intentID", retrievePaymentIntent);
}
catch (error) { }
module.exports = router;
