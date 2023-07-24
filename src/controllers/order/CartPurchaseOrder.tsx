
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
const Order = require("../../model/order.model");


/**
 * Handles the purchase of items from the cart and creates orders.
 *
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<Response>} The HTTP response indicating the status of the order creation.
 * @throws {Api400Error} If required request body is missing.
 * @throws {Api401Error} If the customer email is unauthorized.
 * @throws {Api400Error} If the user is not found with the provided email.
 * @throws {Api400Error} If the required shipping address is missing.
 * @throws {Api400Error} If there are no items in the cart.
 * @throws {Api503Error} If the service is unavailable.
 * @throws {Api400Error} If the payment intent creation fails.
 * @throws {Api400Error} If the order processing fails.
 */

async function createPaymentIntents(totalAmount: number, orderIDs: any[]) {
   try {
      // Creating payment intent after getting total amount of order items. 
      const paymentIntents = await stripe.paymentIntents.create({
         amount: (totalAmount * 100),
         currency: 'bdt',
         payment_method_types: ['card'],
         metadata: {
            order_id: orderIDs.join(", ")
         }
      });

      return paymentIntents;

   } catch (e: any) {
      switch (e.type) {
         case 'StripeCardError':
            throw new apiResponse.Api400Error(`A payment error occurred: ${e.message}`);
            break;
         case 'StripeInvalidRequestError':
            console.log('An invalid request occurred.');
            break;
         default:
            console.log('Another problem occurred, maybe unrelated to Stripe.');
            break;
      }
   }
}

module.exports = async function CartPurchaseOrder(req: Request, res: Response, next: NextFunction) {
   try {

      const { email, _uuid } = req.decoded;

      // initialized current time stamp
      const timestamp: any = Date.now();
      const timeObject = {
         iso: new Date(timestamp),
         time: new Date(timestamp).toLocaleTimeString(),
         date: new Date(timestamp).toDateString(),
         timestamp: timestamp
      }

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
                                    { $eq: ['$$variation.sku', '$items.sku'] },
                                    { $eq: ['$$variation.stock', "in"] },
                                    { $eq: ["$status", "active"] },
                                    { $gte: ["$$variation.available", "$items.quantity"] }
                                 ]
                              }

                           }
                        }, 0]
                     },
                     {}
                  ]
               },
            },
         },
         {
            $project: {
               _id: 0,
               variations: 1,
               quantity: "$items.quantity",
               shipping: 1,
               packaged: 1,

               supplier: 1,
               product: {
                  title: 1,
                  slug: "$slug",
                  brand: "$brand",
                  sku: "$variations.sku",
                  listing_id: "$items.listingID",
                  product_id: "$items.productID",
                  imageUrl: { $arrayElemAt: ["$variations.images", 0] },
                  sellingPrice: "$variations.pricing.sellingPrice",
                  baseAmount: { $multiply: ["$variations.pricing.sellingPrice", '$items.quantity'] }
               },

            }
         },
         { $unset: ["variations", "items"] }
      ]);



      if (!cartItems || cartItems.length <= 0 || !Array.isArray(cartItems))
         throw new apiResponse.Api400Error("Nothing for purchase ! Please add product in your cart.");

      // adding order id tracking id in individual order items

      const productInfos: any[] = [];

      let cartTotal: number = 0;
      let totalAmount: number = 0;
      let shippingTotal: number = 0;
      const groupOrdersBySeller: any = {};
      let orderIDs: any[] = []

      cartItems.forEach((item: any) => {

         item["shipping_charge"] = item?.shipping?.isFree ? 0 : calculateShippingCost((item?.packaged?.volumetricWeight * item?.quantity), areaType);

         item["final_amount"] = parseInt(item?.product?.base_amount + item?.shipping_charge);

         item["order_id"] = generateOrderID(item?.supplier?.email);

         item["payment"] = {
            status: "pending",
            mode: "card"
         };

         item["order_placed_at"] = timeObject;

         item["state"] = state;

         item["customer"] = {
            id: _uuid,
            email,
            shipping_address: defaultAddress
         }

         item["order_status"] = "placed";

         totalAmount += item?.final_amount;

         shippingTotal += item?.shipping_charge;

         cartTotal += parseInt(item?.product?.base_amount);

         productInfos.push({
            productID: item?.product?.product_id,
            listingID: item?.product?.listing_id,
            sku: item?.product?.sku,
            quantity: item?.quantity
         });


         if (!groupOrdersBySeller[item?.supplier?.email]) {
            groupOrdersBySeller[item?.supplier?.email] = { items: [] };
         }

         groupOrdersBySeller[item?.supplier?.email].items.push(item);
         orderIDs.push(item?.order_id);
      });



      if (!totalAmount) throw new apiResponse.Api503Error("Service unavailable !");


      if (totalAmount >= 500) {
         totalAmount = totalAmount - shippingTotal;
      }

      // Creating payment intent after getting total amount of order items. 
      const { client_secret, metadata, id } = await createPaymentIntents(totalAmount, orderIDs);

      if (!client_secret)
         throw new apiResponse.Api400Error("The payment intents failed. Please try again later or contact support if the problem persists.");

      // after order succeed then group the order item by seller email and send email to the seller
      // const orders: any[] = [];

      await Order.insertMany(cartItems);

      // after successfully got order by seller as a object then loop it and trigger send email function inside for in loop
      for (const sEmail in groupOrdersBySeller) {

         const { items } = groupOrdersBySeller[sEmail]

         // calculate total amount of orders by seller;
         const totalAmount: number = items.reduce((p: number, n: any) => p + parseInt(n?.final_amount), 0) || 0;

         await email_service({
            to: sEmail,
            subject: "New order confirmed",
            html: seller_order_email_template(items, email, orderIDs, totalAmount)
         });
      }

      // after calculating total amount and order succeed then email sent to the buyer
      await email_service({
         to: email,
         subject: "Order confirmed",
         html: buyer_order_email_template(cartItems, { timeObject, shippingAddress: defaultAddress, totalAmount, cartTotal, shippingTotal, email, state })
      });

      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: "Order confirming soon..",
         totalAmount,
         clientSecret: client_secret,
         orderPaymentID: metadata?.order_id,
         paymentIntentID: id,
         orderIDs,
         productInfos
      });

   } catch (error: any) {
      next(error);
   }
};