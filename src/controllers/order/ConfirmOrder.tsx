import { NextFunction, Request, Response } from "express";
const { update_variation_stock_available, clearCart } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const Order = require("../../model/order.model");
const NCache = require("../../utils/NodeCache");


module.exports = async function confirmOrder(req: Request, res: Response, next: NextFunction) {
   try {

      const { email } = req.decoded;

      const { paymentMethodID, orderPaymentID, productInfos, orderState, orderIDs, paymentIntentID, clientSecret } = req.body as {
         paymentMethodID: any;
         orderPaymentID: string;
         productInfos: any[];
         orderState: string;
         orderIDs: any[];
         paymentIntentID: string;
         clientSecret: string;
      };

      if (!req.body || typeof req.body !== "object" || !orderPaymentID || !productInfos)
         throw new apiResponse.Api503Error("Service unavailable !");

      await Order.updateMany({ $and: [{ orderID: orderIDs }] },
         {
            $set: {
               "payment.method_id": paymentMethodID,
               "payment.intent_id": paymentIntentID,
               "payment.client_secret": clientSecret,
               "payment.status": "paid"
            }
         }, {
      });

      await NCache.deleteCache(`${email}_myOrders`);

      if (paymentMethodID && clientSecret && productInfos) {

         const orderPromises: any = productInfos.map(async (item: any) => await update_variation_stock_available("dec", {
            productID: item?.productID,
            listingID: item?.listingID,
            sku: item?.sku,
            quantity: item?.quantity
         }));

         const result = await Promise.all(orderPromises);

         if (result && orderState === "byCart") {
            await clearCart(email);
         }
         // after order confirmed then return response to the client
         return res.status(200).send({ message: "Order completed.", statusCode: 200, success: true });
      }

   } catch (error: any) {
      next(error);
   }
}