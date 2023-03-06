import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");
const { update_variation_stock_available, actualSellingPrice, calculateShippingCost } = require("../../services/common.services");


module.exports = async function confirmOrder(req: Request, res: Response, next: NextFunction) {
   try {
      const body = req.body;

      if (!body || typeof body !== "object") {
         return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
      }

      const { paymentIntentID, paymentMethodID, orderPaymentID, orderItems } = body;

      const email = req.decoded.email;
      const uuid = req.decoded._UUID;

      if (!paymentIntentID || !paymentMethodID) {
         return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
      }

      if (!orderItems || !Array.isArray(orderItems) || orderItems.length <= 0) {
         return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
      }

      async function confirmOrderHandler(item: any) {
         if (!item) {
            return;
         }

         const { productID, variationID, listingID, quantity, areaType } = item;

         if (areaType !== "local" && areaType !== "zonal") {
            return;
         }

         let product;

         let newProduct = await Product.aggregate([
            { $match: { $and: [{ _LID: listingID }, { _id: ObjectId(productID) }] } },
            { $unwind: { path: "$variations" } },
            {
               $match: {
                  $expr: {
                     $and: [
                        { $eq: ['$variations._VID', variationID] },
                        { $eq: ["$variations.stock", "in"] },
                        { $eq: ["$variations.status", "active"] },
                        { $gte: ["$variations.available", parseInt(quantity)] }
                     ]
                  }
               }
            },
            {
               $project: {
                  _id: 0,
                  title: "$variations.vTitle",
                  slug: 1,
                  variations: 1,
                  brand: 1,
                  image: { $first: "$images" },
                  sku: "$variations.sku",
                  shipping: 1,
                  package: 1,
                  sellerData: {
                     sellerID: "$sellerData.sellerID",
                     storeName: "$sellerData.storeName"
                  },
                  baseAmount: { $multiply: [actualSellingPrice, parseInt(quantity)] },
                  sellingPrice: actualSellingPrice
               }
            },
            {
               $set: {
                  paymentMode: "card",
                  state: item?.state,
                  shippingAddress: item?.shippingAddress,
                  paymentStatus: "success",
                  customerID: uuid,
                  customerEmail: email,
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

         product = newProduct[0];

         product["orderID"] = "oi_" + (Math.floor(10000000 + Math.random() * 999999999999)).toString();

         product["trackingID"] = "tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString();


         if (product?.shipping?.isFree && product?.shipping?.isFree) {
            product["shippingCharge"] = 0;
         } else {
            product["shippingCharge"] = calculateShippingCost(product?.package?.volumetricWeight, areaType);
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

            return {
               orderConfirmSuccess: true,
               message: "Order success for " + product?.title,
               orderID: product?.orderID,
               baseAmount: item?.baseAmount
            };
         }
      }

      const promises: any = Array.isArray(orderItems) && orderItems.map(async (orderItem: any) => await confirmOrderHandler(orderItem));

      let upRes: any = await Promise.all(promises);


      if (upRes) {
         return res.status(200).send({ message: "order success", statusCode: 200, success: true, data: upRes });
      }

   } catch (error: any) {
      next(error);
   }
}