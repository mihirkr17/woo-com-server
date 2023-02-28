import { NextFunction, Request, Response } from "express";
const response = require("../../errors/apiResponse");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const ShoppingCart = require("../../model/shoppingCart.model");
const { findUserByEmail } = require("../../services/common.services");


module.exports = async function SetOrder(req: Request, res: Response, next: NextFunction) {
   try {
      const userEmail: string = req.headers.authorization || "";
      const authEmail: string = req.decoded.email;
      const body: any = req.body;

      if (userEmail !== authEmail) {
         throw new response.Api401Error("AuthError", "Unauthorized access !");
      }

      if (!body || typeof body === "undefined") {
         throw new response.Api400Error("ClientError", "Required body !");
      }

      let user = await findUserByEmail(authEmail);

      let defaultAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
         user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

      if (!defaultAddress) {
         throw new response.Api400Error("ClientError", "Required shipping address !");
      }

      let areaType = defaultAddress?.area_type;

      const orderItems = await ShoppingCart.aggregate([
         { $match: { customerEmail: authEmail } },
         {
            $lookup: {
               from: 'products',
               localField: 'listingID',
               foreignField: "_LID",
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
                     { $eq: ['$variations._VID', '$variationID'] },
                     { $eq: ["$variations.stock", "in"] },
                     { $eq: ["$variations.status", "active"] },
                     { $gt: ["$variations.available", "$quantity"] }
                  ]

               }
            }
         },
         {
            $project: {
               _id: 0,
               variations: 1,
               quantity: 1,
               productID: 1,
               listingID: 1,
               variationID: 1,
               baseAmount: {
                  $add: [
                     { $multiply: ['$variations.pricing.sellingPrice', '$quantity'] },
                     {
                        $switch: {
                           branches: [
                              { case: { $eq: [areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                              { case: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                           ],
                           default: "$shipping.delivery.zonalCharge"
                        }
                     }
                  ]
               }
            }
         },
         {
            $set: {
               shippingAddress: defaultAddress,
               areaType: areaType,
               state: body?.state
            }
         },
         { $unset: ["variations"] }
      ]);

      if (!orderItems || orderItems.length <= 0) {
         throw new response.Api400Error("ClientError", "Nothing for purchase ! Please add product in your cart.");
      }


      let totalAmount = Array.isArray(orderItems) &&
         orderItems.map((item: any) => parseFloat(item?.baseAmount)).reduce((p: any, n: any) => p + n, 0).toFixed(2);

      totalAmount = parseFloat(totalAmount);

      if (!totalAmount) {
         return res.status(402).send();
      }

      // Creating payment intent after getting total amount of order items. 
      const paymentIntent = await stripe.paymentIntents.create({
         amount: (totalAmount * 100),
         currency: 'bdt',
         payment_method_types: ['card'],
         metadata: {
            order_id: "OP-" + (Math.round(Math.random() * 99999999) + parseInt(totalAmount)).toString()
         }
      });

      if (!paymentIntent?.client_secret) {
         throw new response.Api400Error("ClientError", "Payment failed.");
      }


      return res.status(200).send({
         success: true,
         statusCode: 200,
         orderItems,
         totalAmount: totalAmount,
         clientSecret: paymentIntent?.client_secret,
         orderPaymentID: paymentIntent?.metadata?.order_id
      });

   } catch (error: any) {
      next(error);
   }
};


