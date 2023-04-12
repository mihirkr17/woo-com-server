
// src/controllers/order/SetOrder.tsx

import { NextFunction, Request, Response } from "express";
const apiResponse = require("../../errors/apiResponse");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const ShoppingCart = require("../../model/shoppingCart.model");
const { findUserByEmail, actualSellingPrice, calculateShippingCost, update_variation_stock_available } = require("../../services/common.service");
const Order = require("../../model/order.model");
const email_service = require("../../services/email.service");


module.exports = async function SetOrder(req: Request, res: Response, next: NextFunction) {
   try {
      const userEmail: string = req.headers.authorization || "";

      const { email: authEmail, _uuid } = req.decoded;

      if (userEmail !== authEmail) {
         throw new apiResponse.Api401Error("Unauthorized access !");
      }

      if (!req.body || typeof req.body === "undefined") {
         throw new apiResponse.Api400Error("Required body !");
      }

      const { state } = req.body;

      let user = await findUserByEmail(authEmail);

      let defaultAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
         user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

      if (!defaultAddress) {
         throw new apiResponse.Api400Error("Required shipping address !");
      }

      let areaType = defaultAddress?.area_type;

      const orderItems = await ShoppingCart.aggregate([
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
                  storeName: "$sellerData.storeName"
               },
               sku: "$variations.sku",
               baseAmount: { $multiply: [actualSellingPrice, '$items.quantity'] },
               sellingPrice: actualSellingPrice
            }
         },
         {
            $set: {
               customerEmail: authEmail,
               customerID: _uuid,
               shippingAddress: defaultAddress,
               areaType: areaType,
               state: state
            }
         },
         { $unset: ["variations", "items"] }
      ]);

      if (!orderItems || orderItems.length <= 0) {
         throw new apiResponse.Api400Error("Nothing for purchase ! Please add product in your cart.");
      }

      orderItems && orderItems.map((p: any) => {

         if (p?.shipping?.isFree && p?.shipping?.isFree) {
            p["shippingCharge"] = 0;
         } else {
            p["shippingCharge"] = calculateShippingCost(p?.packaged?.volumetricWeight, areaType);
         }

         return p;
      });


      let totalAmount = Array.isArray(orderItems) &&
         orderItems.map((item: any) => (parseInt(item?.baseAmount + item?.shippingCharge))).reduce((p: any, n: any) => p + n, 0);

      totalAmount = parseInt(totalAmount);

      if (!totalAmount) {
         return res.status(402).send();
      }

      // Creating payment intent after getting total amount of order items. 
      const paymentIntent = await stripe.paymentIntents.create({
         amount: (totalAmount * 100),
         currency: 'usd',
         payment_method_types: ['card'],
         metadata: {
            order_id: "opi_" + (Math.round(Math.random() * 99999999) + totalAmount).toString()
         }
      });

      if (!paymentIntent?.client_secret) {
         throw new apiResponse.Api400Error("Payment failed.");
      }

      return res.status(200).send({
         success: true,
         statusCode: 200,
         orderItems,
         totalAmount: totalAmount,
         message: "Order confirming soon..",
         clientSecret: paymentIntent?.client_secret,
         orderPaymentID: paymentIntent?.metadata?.order_id
      });

   } catch (error: any) {
      next(error);
   }
};


