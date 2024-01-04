// RefundPayment.tsx
import { NextFunction, Request, Response } from "express";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { orderStatusUpdater } = require("../services/common.service");
const { Error400 } = require("../res/response");

async function refundPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { chargeID, reason, amount, orderID, customerEmail, trackingID } =
      req.body;

    if (!chargeID) throw new Error("Required charge ID !");

    if (!orderID) throw new Error("Required ORDER_TABLE ID !");

    if (amount && typeof amount !== "number")
      throw new Error("Amount should be number");

    const refund = await stripe.refunds.create({
      charge: chargeID,
      amount: parseInt(amount) * 100,
      reason: reason,
    });

    if (refund) {
      await orderStatusUpdater({
        type: "refunded",
        orderID,
        customerEmail,
        trackingID,
        refundAT: refund?.created,
      });
      return res
        .status(200)
        .send({ success: true, statusCode: 200, data: refund });
    }
  } catch (error: any) {
    next(error);
  }
}

async function retrievePaymentIntent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { intentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(intentId);

    return res.status(200).send(paymentIntent);
  } catch (error: any) {
    next(error);
  }
}

async function createPaymentIntent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    if (!body) {
      throw new Error400({
        success: false,
        statusCode: 400,
        message: "Required body !",
      });
    }

    const { totalAmount, session, paymentMethodId, productIds } = body;

    if (!session)
      throw new Error400({
        success: false,
        statusCode: 400,
        message: "Required session id !",
      });

    if (!totalAmount || typeof totalAmount === "undefined") {
      throw new Error400({
        success: false,
        statusCode: 400,
        message: "Required total amount !",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: parseInt(totalAmount) * 100,
        currency: "bdt",
        metadata: {
          order_id: productIds,
        },
        confirm: true,
        automatic_payment_methods: { enabled: true },
        payment_method: paymentMethodId, // the PaymentMethod ID sent by your client
        return_url: "https://example.com/order/123/complete",
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
      },
      { idempotencyKey: session }
    );

    return res.status(200).send({
      success: true,
      statusCode: 200,
      status: paymentIntent?.status,
      paymentIntentId: paymentIntent?.id,
      clientSecret: paymentIntent?.client_secret,
    });
  } catch (error: any) {
    next(error);
  }
}

module.exports = { refundPayment, retrievePaymentIntent, createPaymentIntent };
