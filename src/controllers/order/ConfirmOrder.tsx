import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");
const { update_variation_stock_available, getSellerInformationByID, calculateShippingCost } = require("../../services/common.service");
const email_service = require("../../services/email.service");


module.exports = async function confirmOrder(req: Request, res: Response, next: NextFunction) {
   try {

      const { email, _uuid } = req.decoded;

      if (!req.body || typeof req.body !== "object") {
         return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
      }

      const { paymentIntentID, paymentMethodID, orderPaymentID, orderItems } = req.body;


      if (!paymentIntentID || !paymentMethodID) {
         return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
      }

      if (!orderItems || !Array.isArray(orderItems) || orderItems.length <= 0) {
         return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
      }

      async function confirmOrderHandler(product: any) {


         if (!product) {
            return;
         }

         const { productID, variationID, listingID, quantity, areaType } = product;

         if (areaType !== "local" && areaType !== "zonal") {
            return;
         }

         product["orderID"] = "oi_" + (Math.floor(10000000 + Math.random() * 999999999999)).toString();

         product["trackingID"] = "tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString();

         product["orderPaymentID"] = orderPaymentID;
         product["paymentIntentID"] = paymentIntentID;
         product["paymentMethodID"] = paymentMethodID;
         product["paymentStatus"] = "success";
         product["paymentMode"] = "card";

         if (product?.shipping?.isFree && product?.shipping?.isFree) {
            product["shippingCharge"] = 0;
         } else {
            product["shippingCharge"] = calculateShippingCost(product?.packaged?.volumetricWeight, areaType);
         }

         let amountNew = product?.baseAmount + product?.shippingCharge;

         product["baseAmount"] = parseInt(amountNew);

         const timestamp: any = Date.now();

         product["orderAT"] = {
            iso: new Date(timestamp),
            time: new Date(timestamp).toLocaleTimeString(),
            date: new Date(timestamp).toDateString(),
            timestamp: timestamp
         }


         let result = await Order.findOneAndUpdate(
            { user_email: email },
            { $push: { orders: product } },
            { upsert: true }
         );

         if (result) {

            let seller = await getSellerInformationByID(product?.sellerData?.sellerID);
            await update_variation_stock_available("dec", { productID, listingID, variationID, quantity });


            if (seller) {
               let mail = await email_service({
                  to: seller?.email,
                  subject: "New order",
                  html: `<div>
                     <h4>You have new order from ${product?.customerEmail}</h4>
                     <p>items: ${product?.title}</p>
                  </div>`
               });

               console.log(mail, product?.customerEmail);
            }

            return {
               orderConfirmSuccess: true,
               message: "Order success for " + product?.title,
               orderID: product?.orderID,
               baseAmount: product?.baseAmount,
               title: product?.title
            };
         }
      }

      const promises: any = Array.isArray(orderItems) && orderItems.map(async (orderItem: any) => await confirmOrderHandler(orderItem));

      let upRes: any = await Promise.all(promises);

      let totalAmount = Array.isArray(upRes) &&
         upRes.map((item: any) => (parseFloat(item?.baseAmount) + item?.shippingCharge)).reduce((p: any, n: any) => p + n, 0).toFixed(2);

      const mail = await email_service({
         to: email,
         subject: "Order confirm",
         html: `<div>
            <ul>
            ${upRes && upRes.map((e: any) => {
            return `<li>${e?.title}</li>`
         })}
            </ul>
            <b>Total amount = ${totalAmount && totalAmount} $</b>
         </div>`
      });


      if (upRes) {
         return res.status(200).send({ message: "order success", statusCode: 200, success: true, data: upRes });
      }

   } catch (error: any) {
      next(error);
   }
}