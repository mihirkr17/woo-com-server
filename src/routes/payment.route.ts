import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT } = require("../middlewares/auth.middleware");
const {
  refundPayment,
  retrievePaymentIntent,
  createPaymentIntent,
} = require("../controllers/payment.controller");

try {
  router.post("/create-payment-intent", verifyJWT, createPaymentIntent);

  router.post("/refund", verifyJWT, refundPayment);

  router.get("/retrieve-payment-intent/:intentID", retrievePaymentIntent);
} catch (error: any) {}

module.exports = router;
