import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
const { update_variation_stock_available, calculateShippingCost } = require("../../services/common.service");
const email_service = require("../../services/email.service");


module.exports = async function confirmOrder(req: Request, res: Response, next: NextFunction) {
   try {

      const { email } = req.decoded;

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
            await update_variation_stock_available("dec", { productID, listingID, variationID, quantity });

console.log(product?.sellerData?.sellerEmail);
            if (product?.sellerData?.sellerEmail && product?.sellerData?.sellerEmail) {
               await email_service({
                  to: product?.sellerData?.sellerEmail,
                  subject: "New order",
                  html: `<div>
                        <h3>You have new order from ${product?.customerEmail}</h3>
                        <p>
                           <pre>
                              Item Name     : ${product?.title} <br />
                              Item SKU      : ${product?.sku} <br />
                              Item Quantity : ${product?.quantity} <br />
                              Item Price    : ${product?.baseAmount} usd
                           </pre>
                        </p>
                        <br />
                        <span>Order ID: <b>${product?.orderID}</b></span> <br />
                        <i>Order At ${product?.orderAT?.time}, ${product?.orderAT?.date}</i>
                     </div>`
               });
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

      let totalAmount: any = Array.isArray(upRes) &&
         upRes.map((item: any) => (parseFloat(item?.baseAmount) + parseFloat(item?.shippingCharge))).reduce((p: any, n: any) => p + n, 0).toFixed(2);

      totalAmount = parseFloat(totalAmount);

      await email_service({
         to: email,
         subject: "Order confirmed",
         html: `<div>
            <ul>
                  ${upRes && upRes.map((e: any) => {
            return `<li>${e?.title}</li>`
         })}
            </ul>
            <br />
            <b>Total amount: ${totalAmount && totalAmount} usd</b>
         </div>`
      });


      if (upRes) {
         return res.status(200).send({ message: "order success", statusCode: 200, success: true, data: upRes });
      }

   } catch (error: any) {
      next(error);
   }
}