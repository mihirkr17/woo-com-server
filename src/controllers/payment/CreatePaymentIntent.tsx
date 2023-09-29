import { NextFunction, Request, Response } from "express";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Api400Error } = require("../../errors/apiResponse");

module.exports = async function CreatePaymentIntent(req: Request, res: Response, next: NextFunction) {
   try {
      const body = req.body;

      if (!body) {
         throw new Api400Error({ success: false, statusCode: 400, message: "Required body !" });
      }

      const { totalAmount, session, paymentMethodId, productIds } = body;

      if (!session) throw new Api400Error({ success: false, statusCode: 400, message: "Required session id !" });

      if (!totalAmount || typeof totalAmount === 'undefined') {
         throw new Api400Error({ success: false, statusCode: 400, message: "Required total amount !" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
         amount: (parseInt(totalAmount) * 100),
         currency: 'bdt',
         metadata: {
            order_id: productIds
         },
         confirm: true,
         automatic_payment_methods: { enabled: true },
         payment_method: paymentMethodId, // the PaymentMethod ID sent by your client
         return_url: 'https://example.com/order/123/complete',
         use_stripe_sdk: true,
         mandate_data: {
            customer_acceptance: {
               type: "online",
               online: {
                  ip_address: req.ip,
                  user_agent: req.get("user-agent"),
               },
            },
         },
      }, { idempotencyKey: session });

      return res.status(200).send({
         success: true,
         statusCode: 200,
         status: paymentIntent?.status,
         paymentIntentId: paymentIntent?.id,
         clientSecret: paymentIntent?.client_secret
      })

   } catch (error: any) {
      next(error);
   }
}