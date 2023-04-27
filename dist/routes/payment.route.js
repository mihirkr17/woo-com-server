"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const CreatePaymentIntent = require("../controllers/payment/CreatePaymentIntent");
const RetrievePaymentIntent = require("../controllers/payment/RetrievePaymentIntent");
const { verifyJWT } = require("../middlewares/auth.middleware");
const RefundPayment = require("../controllers/payment/RefundPayment");
try {
    router.post("/create-payment-intent", verifyJWT, CreatePaymentIntent);
    router.post("/refund", verifyJWT, RefundPayment);
    router.get("/retrieve-payment-intent/:intentID", RetrievePaymentIntent);
}
catch (error) {
}
module.exports = router;
