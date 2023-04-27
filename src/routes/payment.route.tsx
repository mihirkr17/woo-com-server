import express, { Router } from "express";
const router: Router = express.Router();
const CreatePaymentIntent = require("../controllers/payment/CreatePaymentIntent");
const RetrievePaymentIntent = require("../controllers/payment/RetrievePaymentIntent");
const {verifyJWT} = require("../middlewares/auth.middleware");
const RefundPayment = require("../controllers/payment/RefundPayment");

try {
   router.post("/create-payment-intent", verifyJWT, CreatePaymentIntent);

   router.post("/refund", verifyJWT, RefundPayment);

   router.get("/retrieve-payment-intent/:intentID", RetrievePaymentIntent);
} catch (error: any) {

}

module.exports = router;