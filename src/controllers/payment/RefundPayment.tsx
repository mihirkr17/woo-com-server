
// RefundPayment.tsx
import { NextFunction, Request, Response } from "express";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { order_status_updater } = require("../../services/common.service");

module.exports = async function RefundPayment(req: Request, res: Response, next: NextFunction) {
   try {
      const body = req.body;

      const { chargeID, reason, amount, orderID, customerEmail, trackingID } = body;

      if (!chargeID) throw new Error("Required charge ID !");

      if (!orderID) throw new Error("Required Order ID !");

      if (amount && typeof amount !== "number") throw new Error("Amount should be number");

      const refund = await stripe.refunds.create({
         charge: chargeID,
         amount: parseInt(amount) * 100,
         reason: reason
      });

      if (refund) {

         await order_status_updater({ type: "refunded", orderID, customerEmail, trackingID, refundAT: refund?.created });

         return res.status(200).send({ success: true, statusCode: 200, data: refund });
      }


   } catch (error: any) {
      next(error);
   }
}