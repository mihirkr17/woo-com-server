import { NextFunction, Request, Response } from "express";
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");
const apiResponse = require("../../errors/apiResponse");
const { findUserByEmail, update_variation_stock_available } = require("../../services/common.service");
const { calculateShippingCost } = require("../../utils/common");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");
const { generateItemID, generateOrderID } = require("../../utils/generator");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const OrderTableModel = require("../../model/orderTable.model");
const Order = require("../../model/order.model");



module.exports = async function SinglePurchaseOrder(req: Request, res: Response, next: NextFunction) {
   try {

      const { email, _uuid } = req.decoded;
      const timestamp: any = Date.now();

      if (!req.body) throw new apiResponse.Api503Error("Service unavailable !");

      const { sku, productID, quantity, listingID, state, customerEmail } = req.body;

      if (!sku || !productID || !quantity || !listingID || !state || !customerEmail)
         throw new apiResponse.Api400Error("Required sku, productID, quantity, listingID, state, customerEmail");

      const user = await findUserByEmail(email);

      if (!user) throw new apiResponse.Api503Error("Service unavailable !")

      const defaultShippingAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
         user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

      const areaType = defaultShippingAddress?.area_type;

      let product = await Product.aggregate([
         { $match: { $and: [{ _lid: listingID }, { _id: ObjectId(productID) }] } },
         { $unwind: { path: "$variations" } },
         { $match: { $and: [{ 'variations.sku': sku }] } },
         {
            $project: {
               _id: 0,
               variations: 1,

               supplier: 1,
               shipping: 1,
               packaged: 1,
               product: {
                  title: 1,
                  slug: "$slug",
                  brand: "$brand",
                  sku: "$variations.sku",
                  listing_id: "$items.listingID",
                  product_id: "$items.productID",
                  assets: {
                     $ifNull: [
                        { $arrayElemAt: ["$options", { $indexOfArray: ["$options.color", "$variations.brandColor"] }] },
                        null
                     ]
                  },
                  sellingPrice: "$variations.pricing.sellingPrice",
                  base_amount: { $multiply: ["$variations.pricing.sellingPrice", parseInt(quantity)] },
               },
            }
         },
         {
            $set: {
               "product.product_id": productID,
               "product.listing_id": listingID,
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

      const productInfos: any[] = [];

      product["shipping_charge"] = product?.shipping?.isFree ? 0 : calculateShippingCost((product?.packaged?.volumetricWeight * product?.quantity), areaType);
      product["final_amount"] = parseInt(product?.product?.base_amount + product?.shipping_charge);
      product["order_id"] = generateOrderID(product?.supplier?.email);

      product["payment"] = {
         status: "pending",
         mode: "card"
      };

      product["order_placed_at"] = {
         iso: new Date(timestamp),
         time: new Date(timestamp).toLocaleTimeString(),
         date: new Date(timestamp).toDateString(),
         timestamp: timestamp
      };

      product["state"] = state;

      product["customer"] = {
         id: _uuid,
         email,
         shipping_address: defaultShippingAddress
      }

      product["order_status"] = "placed";

      productInfos.push({
         productID: product?.product?.product_id,
         listingID: product?.product?.listing_id,
         sku: product?.product?.sku,
         quantity: product?.quantity
      })

      const totalAmount: number = product.final_amount || 0;

      // creating payment intents here
      const { client_secret, metadata, id } = await stripe.paymentIntents.create({
         amount: (totalAmount * 100),
         currency: 'bdt',
         payment_method_types: ['card'],
         metadata: {
            order_id: product?.order_id
         }
      });


      if (!client_secret) throw new apiResponse.Api400Error("Payment intent creation failed !");

      const orderTable = new Order(product);

      const result = await orderTable.save();

      await email_service({
         to: product?.supplier?.email,
         subject: "New order confirmed",
         html: seller_order_email_template([product], email, [result?.orderID], totalAmount)
      });

      // after calculating total amount and order succeed then email sent to the buyer
      await email_service({
         to: email,
         subject: "Order confirmed",
         html: buyer_order_email_template(product, totalAmount)
      });

      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: "Order confirming soon..",
         totalAmount,
         clientSecret: client_secret,
         orderPaymentID: metadata?.order_id,
         paymentIntentID: id,
         orderIDs: [product?.order_id],
         productInfos
      });
   } catch (error: any) {
      next(error)
   }
}


