import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");
const apiResponse = require("../../errors/apiResponse");
const { findUserByEmail, update_variation_stock_available, actualSellingPrice, calculateShippingCost } = require("../../services/common.service");
const email_service = require("../../services/email.service");


module.exports = async function SinglePurchaseOrder(req: Request, res: Response, next: NextFunction) {
   try {
      const authEmail = req.decoded.email;
      const body = req.body;
      const uuid = req.decoded._uuid;

      if (!body) {
         return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
      }

      const { variationID, productID, quantity, listingID, paymentIntentID, state, paymentMethodID, orderPaymentID, customerEmail } = body;

      let user = await findUserByEmail(authEmail);

      if (!user) {
         return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
      }

      let defaultShippingAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
         user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

      let areaType = defaultShippingAddress?.area_type;

      let product = await Product.aggregate([
         { $match: { $and: [{ _lid: listingID }, { _id: ObjectId(productID) }] } },
         { $unwind: { path: "$variations" } },
         { $match: { $and: [{ 'variations._vrid': variationID }] } },
         {
            $project: {
               _id: 0,
               title: "$variations.vTitle",
               slug: 1,
               variations: 1,
               brand: 1,
               image: { $first: "$images" },
               sku: "$variations.sku",
               sellerData: {
                  sellerEmail: '$sellerData.sellerEmail',
                  sellerID: "$sellerData.sellerID",
                  storeName: "$sellerData.storeName"
               },
               shipping: 1,
               packaged: 1,
               baseAmount: { $multiply: [actualSellingPrice, parseInt(quantity)] },
               sellingPrice: actualSellingPrice,
            }
         },
         {
            $set: {
               customerEmail: customerEmail,
               paymentMode: "card",
               state: state,
               shippingAddress: defaultShippingAddress,
               paymentStatus: "success",
               customerID: uuid,
               orderStatus: "pending",
               paymentIntentID: paymentIntentID,
               paymentMethodID: paymentMethodID,
               orderPaymentID: orderPaymentID,
               productID: productID,
               listingID: listingID,
               variationID: variationID,
               quantity: quantity
            }
         },
         {
            $unset: ["variations"]
         }

      ]);

      if (product && typeof product !== 'undefined') {
         product = product[0];

         product["orderID"] = "oi_" + (Math.floor(10000000 + Math.random() * 999999999999)).toString();

         product["trackingID"] = "tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString();

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
            { user_email: authEmail },
            { $push: { orders: product } },
            { upsert: true }
         );

         if (result) {
            await update_variation_stock_available("dec", { variationID, productID, quantity, listingID });

            authEmail && await email_service({
               to: authEmail,
               subject: "Order confirmed",
               html: `<div>
                  <table style="padding: '5px 2px'">
                     <caption style="padding: '4px'; background-color: 'black'; color: 'white'">Order Details:</caption>
                     <thead>
                        <tr>
                           <th>No.</th>
                           <th>Product</th>
                           <th>Price</th>
                           <th>Quantity</th>
                        </tr>
                     </thead>
                     <tbody>
                        <tr>
                              <td>1</td>
                              <td>${product?.title}</td>
                              <td>${product?.baseAmount}</td>
                              <td>${product?.quantity}</td>
                        </tr>
                     </tbody>
                     <tfoot>
                        <tr>
                           <th colspan= "100%"><b style="width: '100%'; text-align: 'center'; background-color: 'black'; color: 'white'">Total amount: ${product?.baseAmount} USD</b></th>
                        </tr>
                     </tfoot>
                  </table>
                  <br />
               </div>`
            });

            product?.sellerData?.sellerEmail && await email_service({
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

            return res.status(200).send({ success: true, statusCode: 200, message: "Order Success." });
         }

      }
   } catch (error: any) {
      next(error)
   }
}


