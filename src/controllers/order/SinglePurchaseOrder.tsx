import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
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



module.exports = async function SinglePurchaseOrder(req: Request, res: Response, next: NextFunction) {
   try {

      const { email, _uuid } = req.decoded;
      const timestamp: any = Date.now();

      if (!req.body) throw new apiResponse.Api503Error("Service unavailable !");

      const { variationID, productID, quantity, listingID, state, customerEmail, variantID } = req.body;

      if (!variationID || !productID || !quantity || !listingID || !state || !customerEmail)
         throw new apiResponse.Api400Error("Required variationID, productID, quantity, listingID, state, customerEmail");

      const user = await findUserByEmail(email);

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
               assets: {
                  $ifNull: [
                     { $arrayElemAt: ["$options", { $indexOfArray: ["$options.color", "$variations.variant.color"] }] },
                     null
                  ]
               },
               sku: "$variations.sku",
               supplier: {
                  email: '$supplier.email',
                  id: "$supplier.id",
                  store_name: "$supplier.store_name"
               },
               variant: {
                  $arrayElemAt: [{
                     $filter: {
                        input: "$variations.variants",
                        as: "variant",
                        cond: { $eq: ["$$variant.variant_id", variantID] }
                     }
                  }, 0]
               },
               shipping: 1,
               packaged: 1,
               baseAmount: { $multiply: ["$variations.pricing.sellingPrice", parseInt(quantity)] },
               sellingPrice: "$variations.pricing.sellingPrice",
            }
         },
         {
            $set: {
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

      let itemNumber = 1;
      let sellerEmail = "";
      let sellerStore = "";
      let sellerID = "";
      const productInfos: any[] = [];

      product.forEach((p: any) => {
         p["shippingCharge"] = p?.shipping?.isFree ? 0 : calculateShippingCost((p?.packaged?.volumetricWeight * p?.quantity), areaType);
         p["itemID"] = "item" + (generateItemID() + (itemNumber++)).toString();
         p["baseAmount"] = parseInt(p?.baseAmount + p?.shippingCharge);
         sellerEmail = p?.supplier?.email;
         sellerStore = p?.supplier?.store_name;
         sellerID = p?.supplier?.id;
         productInfos.push({
            productID: p?.productID,
            listingID: p?.listingID,
            variationID: p?.variationID,
            quantity: p?.quantity
         })
         return p;
      });

      const totalAmount: number = product.reduce((p: number, n: any) => p + parseInt(n?.baseAmount), 0) || 0;

      // creating payment intents here
      const { client_secret, metadata, id } = await stripe.paymentIntents.create({
         amount: (totalAmount * 100),
         currency: 'bdt',
         payment_method_types: ['card'],
         metadata: {
            order_id: "opi_" + (Math.round(Math.random() * 99999999) + totalAmount).toString()
         }
      });


      if (!client_secret) throw new apiResponse.Api400Error("Payment intent creation failed !");

      const orderTable = new OrderTableModel({
         orderID: generateOrderID(sellerID),
         orderPaymentID: metadata?.order_id,
         clientSecret: client_secret,
         customerEmail: email,
         customerID: _uuid,
         seller: {
            email: sellerEmail,
            store: sellerStore
         },
         totalAmount,
         paymentIntentID: id,
         paymentStatus: "pending",
         orderAT: {
            iso: new Date(timestamp),
            time: new Date(timestamp).toLocaleTimeString(),
            date: new Date(timestamp).toDateString(),
            timestamp
         },
         state,
         shippingAddress: defaultShippingAddress,
         areaType,
         paymentMode: "card",
         orderStatus: "placed",
         items: product,
      });

      const result = await orderTable.save();

      await email_service({
         to: sellerEmail,
         subject: "New order confirmed",
         html: seller_order_email_template(product, email, result?.orderID)
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
         productInfos
      });
   } catch (error: any) {
      next(error)
   }
}


