
// src/controllers/order/SetOrder.tsx

import { NextFunction, Request, Response } from "express";
const apiResponse = require("../../errors/apiResponse");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const ShoppingCart = require("../../model/shoppingCart.model");
const { findUserByEmail, actualSellingPrice, calculateShippingCost } = require("../../services/common.service");
const OrderTableModel = require("../../model/orderTable.model");
const { generateItemID, generateOrderID } = require("../../utils/common");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");

module.exports = async function CartPurchaseOrder(req: Request, res: Response, next: NextFunction) {
   try {

      const { email: authEmail, _uuid } = req.decoded;

      // initialized current time stamp
      const timestamp: any = Date.now();


      if (!req.body || typeof req.body === "undefined")
         throw new apiResponse.Api400Error("Required body !");

      // get state by body
      const { state, customerEmail } = req.body;

      if (customerEmail !== authEmail)
      throw new apiResponse.Api401Error("Unauthorized access !");

      // finding user by email;
      const user = await findUserByEmail(authEmail);

      if (!user) throw new apiResponse.Api400Error(`Sorry, User not found with this ${authEmail}`);

      // getting default shipping address from user data;
      const defaultAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
         user?.buyer?.shippingAddress.find((adr: any) => adr?.default_shipping_address === true));

      if (!defaultAddress)
         throw new apiResponse.Api400Error("Required shipping address !");

      const areaType = defaultAddress?.area_type;

      const cartItems = await ShoppingCart.aggregate([
         { $match: { customerEmail: authEmail } },
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
         { $unwind: { path: "$variations" } },
         {
            $match: {
               $expr: {
                  $and: [
                     { $eq: ['$variations._vrid', '$items.variationID'] },
                     { $eq: ["$variations.stock", "in"] },
                     { $eq: ["$variations.status", "active"] },
                     { $gte: ["$variations.available", "$items.quantity"] }
                  ]

               }
            }
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
               image: { $first: "$images" },
               title: "$variations.vTitle",
               slug: 1,
               brand: 1,
               sellerData: {
                  sellerEmail: '$sellerData.sellerEmail',
                  sellerID: "$sellerData.sellerID",
                  storeName: "$sellerData.storeName",
                  stripeID: "$sellerData.stripeID"
               },
               sku: "$variations.sku",
               baseAmount: { $multiply: [actualSellingPrice, '$items.quantity'] },
               sellingPrice: actualSellingPrice
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
         item["shippingCharge"] = item?.shipping?.isFree ? 0 : calculateShippingCost(item?.packaged?.volumetricWeight, areaType);
         item["itemID"] = "item" + (generateItemID() + (itemNumber++)).toString();
         item["baseAmount"] = parseInt(item?.baseAmount + item?.shippingCharge);

         totalAmount += item?.baseAmount;

         productInfos.push({
            productID: item?.productID,
            listingID: item?.listingID,
            variationID: item?.variationID,
            quantity: item?.quantity
         });


         if (!groupOrdersBySeller[item?.sellerData?.sellerEmail]) {
            groupOrdersBySeller[item?.sellerData?.sellerEmail] = { items: [], sellerStore: "", sellerID: "" };
         }

         groupOrdersBySeller[item?.sellerData?.sellerEmail].sellerStore = item?.sellerData?.storeName;
         groupOrdersBySeller[item?.sellerData?.sellerEmail].sellerID = item?.sellerData?.sellerID;
         groupOrdersBySeller[item?.sellerData?.sellerEmail].items.push(item);

         return item;
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
      for (const sellerEmail in groupOrdersBySeller) {

         const { items, sellerStore, sellerID } = groupOrdersBySeller[sellerEmail]

         // calculate total amount of orders by seller;
         const totalAmount: number = items.reduce((p: number, n: any) => p + parseInt(n?.baseAmount), 0) || 0;

         // generate random order ids;
         const orderID = generateOrderID(sellerID);

         // then pushing them to orders variable;
         orders.push({
            orderID,
            orderPaymentID: metadata?.order_id,
            clientSecret: client_secret,
            customerEmail: authEmail,
            customerID: _uuid,
            sellerEmail,
            sellerStore,
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
            orderStatus: "pending",
            items: items,
         });


         await email_service({
            to: sellerEmail,
            subject: "New order confirmed",
            html: seller_order_email_template(items, authEmail, orderID)
         });
      }


      // finally insert orders to the database;
      const result = await OrderTableModel.insertMany(orders);

      if (!result || result.length <= 0) throw new apiResponse.Api400Error("Sorry order processing failed !");

      // after calculating total amount and order succeed then email sent to the buyer
      await email_service({
         to: authEmail,
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







// module.exports = async function SetOrder(req: Request, res: Response, next: NextFunction) {
//    try {
//       const userEmail: string = req.headers.authorization || "";

//       const { email: authEmail, _uuid } = req.decoded;

//       if (userEmail !== authEmail)
//          throw new apiResponse.Api401Error("Unauthorized access !");


//       if (!req.body || typeof req.body === "undefined")
//          throw new apiResponse.Api400Error("Required body !");


//       const { state } = req.body;

//       const user = await findUserByEmail(authEmail);

//       const defaultAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
//          user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

//       if (!defaultAddress)
//          throw new apiResponse.Api400Error("Required shipping address !");


//       const areaType = defaultAddress?.area_type;

//       const cartItems = await ShoppingCart.aggregate([
//          { $match: { customerEmail: authEmail } },
//          { $unwind: { path: "$items" } },
//          {
//             $lookup: {
//                from: 'products',
//                localField: 'items.listingID',
//                foreignField: "_lid",
//                as: "main_product"
//             }
//          },
//          { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
//          { $unset: ["main_product"] },
//          { $unwind: { path: "$variations" } },
//          {
//             $match: {
//                $expr: {
//                   $and: [
//                      { $eq: ['$variations._vrid', '$items.variationID'] },
//                      { $eq: ["$variations.stock", "in"] },
//                      { $eq: ["$variations.status", "active"] },
//                      { $gte: ["$variations.available", "$items.quantity"] }
//                   ]

//                }
//             }
//          },
//          {
//             $project: {
//                _id: 0,
//                variations: 1,
//                quantity: "$items.quantity",
//                shipping: 1,
//                productID: "$items.productID",
//                packaged: 1,
//                listingID: "$items.listingID",
//                variationID: "$items.variationID",
//                image: { $first: "$images" },
//                title: "$variations.vTitle",
//                slug: 1,
//                brand: 1,
//                sellerData: {
//                   sellerEmail: '$sellerData.sellerEmail',
//                   sellerID: "$sellerData.sellerID",
//                   storeName: "$sellerData.storeName"
//                },
//                sku: "$variations.sku",
//                baseAmount: { $multiply: [actualSellingPrice, '$items.quantity'] },
//                sellingPrice: actualSellingPrice
//             }
//          },
//          {
//             $set: {
//                customerEmail: authEmail,
//                customerID: _uuid,
//                shippingAddress: defaultAddress,
//                areaType: areaType,
//                state: state
//             }
//          },
//          { $unset: ["variations", "items"] }
//       ]);

//       if (!cartItems || cartItems.length <= 0 || !Array.isArray(cartItems))
//          throw new apiResponse.Api400Error("Nothing for purchase ! Please add product in your cart.");

//       cartItems.forEach((p: any) => {
//          p["shippingCharge"] = p?.shipping?.isFree ? 0 : calculateShippingCost(p?.packaged?.volumetricWeight, areaType);

//          return p;
//       });

//       // calculating total amount of order items
//       const totalAmount: number = cartItems.reduce((p: number, n: any) => p + parseInt(n?.baseAmount + n?.shippingCharge), 0) || 0;

//       if (!totalAmount) throw new apiResponse.Api503Error("Service unavailable !");

//       // Creating payment intent after getting total amount of order items. 
//       const { client_secret, metadata } = await stripe.paymentIntents.create({
//          amount: (totalAmount * 100),
//          currency: 'usd',
//          payment_method_types: ['card'],
//          metadata: {
//             order_id: "opi_" + (Math.round(Math.random() * 99999999) + totalAmount).toString()
//          }
//       });

//       if (!client_secret)
//          throw new apiResponse.Api400Error("The payment failed. Please try again later or contact support if the problem persists.");

//       return res.status(200).send({
//          success: true,
//          statusCode: 200,
//          cartItems,
//          totalAmount: totalAmount,
//          message: "Order confirming soon..",
//          clientSecret: client_secret,
//          orderPaymentID: metadata?.order_id
//       });

//    } catch (error: any) {
//       next(error);
//    }
// };
