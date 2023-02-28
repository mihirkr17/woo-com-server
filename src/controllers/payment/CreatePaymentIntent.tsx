import { NextFunction, Request, Response } from "express";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async function CreatePaymentIntent(req: Request, res: Response, next: NextFunction) {
   try {
      const body = req.body;

      if (!body) {
         return res.status(400).send({ success: false, statusCode: 400, message: "Required body !" });
      }

      const { totalAmount } = body;

      if (!totalAmount || typeof totalAmount === 'undefined') {
         return res.status(400).send({ success: false, statusCode: 400, message: "Required total amount !" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
         amount: (parseInt(totalAmount) * 100),
         currency: 'bdt',
         payment_method_types: ['card'],
         metadata: {
            order_id: "OP-" + (Math.round(Math.random() * 99999999) + parseInt(totalAmount)).toString()
         }
      });

      return res.status(200).send({
         clientSecret: paymentIntent?.client_secret,
         orderPaymentID: paymentIntent?.metadata?.order_id,
         finalAmount: totalAmount
      })

   } catch (error: any) {
      next(error);
   }
}