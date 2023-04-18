import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");
const apiResponse = require("../../errors/apiResponse");
const { findUserByEmail, update_variation_stock_available, actualSellingPrice, calculateShippingCost } = require("../../services/common.service");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");


module.exports = async function SinglePurchaseOrderConfirm(req: Request, res: Response, next: NextFunction) {
   try {
      const authEmail = req.decoded.email;
      
      const { orderPaymentID, clientSecret, paymentIntentID, paymentMethodID, orderID, customerEmail, productID,
         variationID, quantity, listingID, baseAmount, sellerData
      } = req.body;

      if (!orderPaymentID || !clientSecret || !paymentIntentID || !paymentMethodID || !orderID)
         throw new apiResponse.Api400Error(`Required order payment id, client secret, payment intent id, payment method id & order id !`);


      const result: any = await Order.findOneAndUpdate({ user_email: customerEmail }, {
         $set: {
            "orders.$[i].paymentStatus": "success",
            "orders.$[i].paymentMethodID": paymentMethodID
         }
      }, { arrayFilters: [{ "i.orderID": orderID }] });

      if (result) {
         await update_variation_stock_available("dec", { variationID, productID, quantity, listingID });

         authEmail && await email_service({
            to: authEmail,
            subject: "Order confirmed",
            html: buyer_order_email_template(req.body, baseAmount)
         });

         sellerData?.sellerEmail && await email_service({
            to: sellerData?.sellerEmail,
            subject: "New order confirmed",
            html: seller_order_email_template([req.body])
         });

         return res.status(200).send({ success: true, statusCode: 200, message: "Order Success." });
      }

   } catch (error: any) {
      next(error);
   }
}