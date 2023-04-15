import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");
const apiResponse = require("../../errors/apiResponse");
const { findUserByEmail, update_variation_stock_available, actualSellingPrice, calculateShippingCost } = require("../../services/common.service");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");
const { generateOrderID, generateTrackingID } = require("../../utils/common");



module.exports = async function SinglePurchaseOrder(req: Request, res: Response, next: NextFunction) {
   try {
      const authEmail = req.decoded.email;
      const uuid = req.decoded._uuid;
      const timestamp: any = Date.now();

      if (!req.body) throw new apiResponse.Api503Error("Service unavailable !");

      const { variationID, productID, quantity, listingID, paymentIntentID, state, paymentMethodID, orderPaymentID, customerEmail } = req.body;

      if (!variationID || !productID || !quantity || !listingID || !paymentIntentID || !state || !paymentMethodID || !orderPaymentID || !customerEmail)
         throw new apiResponse.Api400Error("Required variationID, productID, quantity, listingID, paymentIntentID, state, paymentMethodID, orderPaymentID, customerEmail");

      const user = await findUserByEmail(authEmail);

      if (!user) throw new apiResponse.Api503Error("Service unavailable !")

      const defaultShippingAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
         user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

      const areaType = defaultShippingAddress?.area_type;

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

      if (typeof product === 'undefined' || !Array.isArray(product))
         throw new apiResponse.Api503Error("Service unavailable !");

      product = product[0];

      product["orderID"] = generateOrderID();
      product["trackingID"] = generateTrackingID();
      product["shippingCharge"] = product?.shipping?.isFree ? 0 : calculateShippingCost(product?.packaged?.volumetricWeight, areaType);
      product["baseAmount"] = parseInt(product?.baseAmount + product?.shippingCharge);
      product["orderAT"] = {
         iso: new Date(timestamp),
         time: new Date(timestamp).toLocaleTimeString(),
         date: new Date(timestamp).toDateString(),
         timestamp: timestamp
      }

      const result = await Order.findOneAndUpdate(
         { user_email: authEmail },
         { $push: { orders: product } },
         { upsert: true }
      );

      if (!result) throw new apiResponse.Api503Error("Service unavailable !");

      await update_variation_stock_available("dec", { variationID, productID, quantity, listingID });

      authEmail && await email_service({
         to: authEmail,
         subject: "Order confirmed",
         html: buyer_order_email_template(product, product?.baseAmount)
      });

      product?.sellerData?.sellerEmail && await email_service({
         to: product?.sellerData?.sellerEmail,
         subject: "New order confirmed",
         html: seller_order_email_template([product])
      });

      return res.status(200).send({ success: true, statusCode: 200, message: "Order Success." });

   } catch (error: any) {
      next(error)
   }
}


