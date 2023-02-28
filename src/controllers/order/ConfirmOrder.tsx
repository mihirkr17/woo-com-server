import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");


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

         if (item?.areaType !== "local" && item?.areaType !== "zonal") {
            return;
         }

         let product;

         let newProduct = await Product.aggregate([
            { $match: { $and: [{ _LID: item?.listingID }, { _id: ObjectId(item?.productID) }] } },
            { $unwind: { path: "$variations" } },
            {
               $match: {
                  $expr: {
                     $and: [
                        { $eq: ['$variations._VID', item?.variationID] },
                        { $eq: ["$variations.stock", "in"] },
                        { $eq: ["$variations.status", "active"] },
                        { $gte: ["$variations.available", parseInt(item?.quantity)] }
                     ]
                  }
               }
            },
            {
               $project: {
                  _id: 0,
                  title: 1,
                  slug: 1,
                  variations: 1,
                  brand: 1,
                  image: { $first: "$variations.images" },
                  sku: "$variations.sku",
                  sellerData: {
                     sellerID: "$sellerData.sellerID",
                     storeName: "$sellerData.storeName"
                  },
                  shippingCharge: {
                     $switch: {
                        branches: [
                           { case: { $eq: [item?.areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                           { case: { $eq: [item?.areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                        ],
                        default: "$shipping.delivery.zonalCharge"
                     }
                  },
                  baseAmount: {
                     $add: [{ $multiply: ['$variations.pricing.sellingPrice', parseInt(item?.quantity)] }, {
                        $switch: {
                           branches: [
                              { case: { $eq: [item?.areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                              { case: { $eq: [item?.areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                           ],
                           default: "$shipping.delivery.zonalCharge"
                        }
                     }]
                  },
                  sellingPrice: "$variations.pricing.sellingPrice",
                  variant: "$variations.variant",
                  totalUnits: "$variations.available"
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
                  productID: item?.productID,
                  listingID: item?.listingID,
                  variationID: item?.variationID,
                  quantity: item?.quantity
               }
            },
            {
               $unset: ["variations"]
            }
         ]);

         product = newProduct[0];

         product["orderID"] = "#" + (Math.floor(10000000 + Math.random() * 999999999999)).toString();

         product["trackingID"] = "TRC" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString();

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
            let availableUnits: number = (parseInt(product?.totalUnits) - parseInt(item?.quantity)) || 0;

            const stock: string = availableUnits <= 0 ? "out" : "in";


            await Product.findOneAndUpdate(
               { _id: ObjectId(product?.productID) },
               {
                  $set: {
                     "variations.$[i].available": availableUnits,
                     "variations.$[i].stock": stock
                  }
               },
               { arrayFilters: [{ "i._VID": product?.variationID }] }
            );

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