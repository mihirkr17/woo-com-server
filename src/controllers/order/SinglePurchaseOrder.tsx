import { NextFunction, Request, Response } from "express";
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");
const apiResponse = require("../../errors/apiResponse");
const { findUserByEmail, createPaymentIntents } = require("../../services/common.service");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");
const Order = require("../../model/order.model");
const { cartContextCalculation } = require("../../utils/common");
const { single_purchase_pipe } = require("../../utils/pipelines");

module.exports = async function SinglePurchaseOrder(req: Request, res: Response, next: NextFunction) {
   try {

      const { email, _id } = req.decoded;
      const timestamp: any = Date.now();

      if (!req.body) throw new apiResponse.Api503Error("Service unavailable !");

      const { sku, productId, quantity, session, paymentMethodId } = req.body;

      if (!sku || !productId || !quantity || !paymentMethodId)
         throw new apiResponse.Api400Error("Required sku, product id, quantity, paymentMethodId");

      const user = await findUserByEmail(email);

      if (!user) throw new apiResponse.Api503Error("Service unavailable !")

      const defaultAddress = user?.shippingAddress?.find((adr: any) => adr?.default_shipping_address === true);

      let item = await Product.aggregate(single_purchase_pipe(productId, sku, quantity));

      if (typeof item === 'undefined' || !Array.isArray(item))
         throw new apiResponse.Api503Error("Service unavailable !");

      const { finalAmount } = cartContextCalculation(item);

      let order = new Order({
         state: "buy",
         customerId: _id,
         shippingAddress: defaultAddress,
         orderStatus: "placed",
         orderPlacedAt: new Date(timestamp),
         paymentMode: "card",
         paymentStatus: "pending",
         items: item,
         totalAmount: finalAmount
      });

      const result = await order.save();

      const intent = await createPaymentIntents(finalAmount, result?._id.toString(), paymentMethodId, session, req?.ip, req.get("user-agent"));

      // if payment success then change order payment status and save
      if (intent?.id) {
         order.paymentIntentId = intent?.id;
         order.paymentStatus = "paid";
         await order.save();
      }


      // after success return the response to the client
      return res.status(200).send({
         success: true,
         statusCode: 200,
         status: intent?.status,
         paymentIntentId: intent?.id,
         clientSecret: intent?.client_secret,
         message: "Payment succeed and order has been placed."
      });
   } catch (error: any) {
      next(error)
   }
}


