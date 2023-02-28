

import { NextFunction, Request, Response } from "express";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../../model/order.model");

module.exports = async function RefundPayment(req: Request, res: Response, next: NextFunction) {
   try {
      const body = req.body;

      const { chargeID, reason, amount, orderID, customerEmail } = body;

      if (!chargeID) throw new Error("Required charge ID !");

      if (amount && typeof amount !== "number") throw new Error("Amount should be number");

      const refund = await stripe.refunds.create({
         charge: chargeID,
         amount: parseInt(amount) * 100,
         reason: reason
      });

      if (refund) {
         await Order.findOneAndUpdate(
            { user_email: customerEmail },
            {
               $set: {
                  "orders.$[i].refund.isRefunded": true,
                  "orders.$[i].refund.refundAT": refund?.created,
                  "orders.$[i].orderStatus": "refunded"
               }
            },
            {
               arrayFilters: [{ "i.orderID": orderID }]
            }
         );

         return res.status(200).send({ success: true, statusCode: 200, data: refund });
      }


   } catch (error: any) {
      next(error);
   }
}