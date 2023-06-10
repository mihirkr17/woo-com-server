
// src/controllers/order/CartPurchaseOrder.tsx

import { NextFunction, Request, Response } from "express";
const apiResponse = require("../../errors/apiResponse");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const ShoppingCart = require("../../model/shoppingCart.model");
const { findUserByEmail } = require("../../services/common.service");
const { calculateShippingCost } = require("../../utils/common");
const OrderTableModel = require("../../model/orderTable.model");
const { generateItemID, generateOrderID } = require("../../utils/generator");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");

module.exports = async function CartPurchaseOrder(req: Request, res: Response, next: NextFunction) {
   try {

      const { email, _uuid } = req.decoded;

      // initialized current time stamp
      const timestamp: any = Date.now();


      if (!req.body || typeof req.body === "undefined")
         throw new apiResponse.Api400Error("Required body !");

      // get state by body
      const { state, customerEmail } = req.body;

      if (customerEmail !== email)
         throw new apiResponse.Api401Error("Unauthorized access !");

      // finding user by email;
      const user = await findUserByEmail(email);

      if (!user) throw new apiResponse.Api400Error(`Sorry, User not found with this ${email}`);

      // getting default shipping address from user data;
      const defaultAddress = user?.buyer?.shippingAddress?.find((adr: any) => adr?.default_shipping_address === true);

      if (!defaultAddress)
         throw new apiResponse.Api400Error("Required shipping address !");

      const areaType = defaultAddress?.area_type;

      const cartItems = await ShoppingCart.aggregate([
         { $match: { customerEmail: email } },
         { $unwind: { path: "$items" } },
         {
            $lookup: {
               from: 'products',
               localField: 'items.listingID',
               foreignField: "_lid",
               as: "main_product"
            }
         },
         { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
         { $unset: ["main_product"] },
         {
            $addFields: {
               variations: {
                  $ifNull: [
                     {
                        $arrayElemAt: [{
                           $filter: {
                              input: "$variations",
                              as: "variation",
                              cond: {
                                 $and: [
                                    { $eq: ['$$variation._vrid', '$items.variationID'] },
                                    { $eq: ['$$variation.stock', "in"] },
                                    { $eq: ["$status", "active"] },
                                    { $eq: ["$save_as", "fulfilled"] },
                                    { $gte: ["$$variation.available", "$items.quantity"] }
                                 ]
                              }
           
                           }
                        }, 0]
                     },
                     {}
                  ]
               }
            },
         },
         {
            $project: {
               _id: 0,
               variations: 1,
               quantity: "$items.quantity",
               shipping: 1,
               productID: "$items.productID",
               packaged: 1,
               listingID: "$items.listingID",
               variationID: "$items.variationID",
               assets: {
                  $ifNull: [
                     { $arrayElemAt: ["$options", { $indexOfArray: ["$options.color", "$variations.variant.color"] }] },
                     null
                  ]
               },
               title: "$variations.vTitle",
               slug: 1,
               brand: 1,
               supplier: 1,
               sku: "$variations.sku",
               baseAmount: { $multiply: ["$variations.pricing.sellingPrice", '$items.quantity'] },
               sellingPrice: "$variations.pricing.sellingPrice",
            }
         },
         { $unset: ["variations", "items"] }
      ]);


      if (!cartItems || cartItems.length <= 0 || !Array.isArray(cartItems))
         throw new apiResponse.Api400Error("Nothing for purchase ! Please add product in your cart.");

      // adding order id tracking id in individual order items
      let itemNumber = 1;

      const productInfos: any[] = [];

      let totalAmount: number = 0;
      const groupOrdersBySeller: any = {};


      cartItems.forEach((item: any) => {
         item["shippingCharge"] = item?.shipping?.isFree ? 0 : calculateShippingCost((item?.packaged?.volumetricWeight * item?.quantity), areaType);
         item["itemID"] = "item" + (generateItemID() + (itemNumber++)).toString();
         item["baseAmount"] = parseInt(item?.baseAmount + item?.shippingCharge);

         totalAmount += item?.baseAmount;

         productInfos.push({
            productID: item?.productID,
            listingID: item?.listingID,
            variationID: item?.variationID,
            quantity: item?.quantity
         });


         if (!groupOrdersBySeller[item?.supplier?.email]) {
            groupOrdersBySeller[item?.supplier?.email] = { items: [], store: "", sellerID: "" };
         }

         groupOrdersBySeller[item?.supplier?.email].store = item?.supplier?.store_name;
         groupOrdersBySeller[item?.supplier?.email].sellerID = item?.supplier?.id;
         groupOrdersBySeller[item?.supplier?.email].items.push(item);
      });

      if (!totalAmount) throw new apiResponse.Api503Error("Service unavailable !");


      // Creating payment intent after getting total amount of order items. 
      const { client_secret, metadata, id } = await stripe.paymentIntents.create({
         amount: (totalAmount * 100),
         currency: 'bdt',
         payment_method_types: ['card'],
         metadata: {
            order_id: "opi_" + (Math.round(Math.random() * 99999999) + totalAmount).toString()
         }
      });

      if (!client_secret)
         throw new apiResponse.Api400Error("The payment intents failed. Please try again later or contact support if the problem persists.");

      // after order succeed then group the order item by seller email and send email to the seller
      const orders: any[] = [];

      // after successfully got order by seller as a object then loop it and trigger send email function inside for in loop
      for (const sEmail in groupOrdersBySeller) {

         const { items, store, sellerID } = groupOrdersBySeller[sEmail]

         // calculate total amount of orders by seller;
         const totalAmount: number = items.reduce((p: number, n: any) => p + parseInt(n?.baseAmount), 0) || 0;

         // generate random order ids;
         const orderID = generateOrderID(sellerID);

         // then pushing them to orders variable;
         orders.push({
            orderID,
            orderPaymentID: metadata?.order_id,
            clientSecret: client_secret,
            customerEmail: email,
            customerID: _uuid,
            seller: {
               email: sEmail,
               store
            },
            totalAmount,
            paymentIntentID: id,
            paymentStatus: "pending",
            orderAT: {
               iso: new Date(timestamp),
               time: new Date(timestamp).toLocaleTimeString(),
               date: new Date(timestamp).toDateString(),
               timestamp: timestamp
            },
            state,
            shippingAddress: defaultAddress,
            areaType,
            paymentMode: "card",
            orderStatus: "placed",
            items: items,
         });


         await email_service({
            to: sEmail,
            subject: "New order confirmed",
            html: seller_order_email_template(items, email, orderID)
         });
      }


      // finally insert orders to the database;
      const result = await OrderTableModel.insertMany(orders);

      if (!result || result.length <= 0) throw new apiResponse.Api400Error("Sorry order processing failed !");

      // after calculating total amount and order succeed then email sent to the buyer
      await email_service({
         to: email,
         subject: "Order confirmed",
         html: buyer_order_email_template(cartItems, totalAmount)
      });

      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: "Order confirming soon..",
         totalAmount,
         clientSecret: client_secret,
         orderPaymentID: metadata?.order_id,
         productInfos
      });

   } catch (error: any) {
      next(error);
   }
};