import { NextFunction, Request, Response } from "express";
const { update_variation_stock_available, clearCart } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const OrderTableModel = require("../../model/orderTable.model");


module.exports = async function confirmOrder(req: Request, res: Response, next: NextFunction) {
   try {

      const { email } = req.decoded;

      const { paymentMethodID, orderPaymentID, productInfos, orderState } = req.body as {
         paymentMethodID: any;
         orderPaymentID: string;
         productInfos: any[];
         orderState: string;
      };

      if (!req.body || typeof req.body !== "object" || !orderPaymentID || !productInfos)
         throw new apiResponse.Api503Error("Service unavailable !");

      await OrderTableModel.updateMany({ $and: [{ orderPaymentID }] },
         {
            $set: {
               paymentMethodID,
               paymentStatus: "paid"
            }
         }, {
      });
      

      const orderPromises: any = paymentMethodID && productInfos.map(async (item: any) => await update_variation_stock_available("dec", {
         productID: item?.productID,
         listingID: item?.listingID,
         variationID: item?.variationID,
         quantity: item?.quantity
      }));

      await Promise.all(orderPromises);

      // after order confirmed then return response to the client
      orderState === "byCart" && await clearCart(email);
      return res.status(200).send({ message: "Order completed.", statusCode: 200, success: true });

   } catch (error: any) {
      next(error);
   }
}