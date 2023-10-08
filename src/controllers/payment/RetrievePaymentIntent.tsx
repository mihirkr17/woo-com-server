import { NextFunction, Request, Response } from "express";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


module.exports = async function RetrievePaymentIntent(req: Request, res: Response, next: NextFunction) {
   try {

      const { intentId } = req.params;

      const paymentIntent = await stripe.paymentIntents.retrieve(
         intentId
      );

      return res.status(200).send(paymentIntent);
   } catch (error: any) {
      next(error)
   }
}