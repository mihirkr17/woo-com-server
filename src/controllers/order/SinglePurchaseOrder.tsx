import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");
const response = require("../../errors/apiResponse");
const { findUserByEmail } = require("../../services/common.services");


module.exports = async function SinglePurchaseOrder(req: Request, res: Response, next: NextFunction) {
   try {
      const authEmail = req.decoded.email;
      const body = req.body;
      const uuid = req.decoded._UUID;

      if (!body) {
         return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
      }

      const { variationID, productID, quantity, listingID, paymentIntentID, state, paymentMethodID, orderPaymentID, customerEmail } = body;

      let user = await findUserByEmail(authEmail);

      if (!user) {
         return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
      }

      let defaultShippingAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
         user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

      let areaType = defaultShippingAddress?.area_type;

      let product = await Product.aggregate([
         { $match: { $and: [{ _LID: listingID }, { _id: ObjectId(productID) }] } },
         { $unwind: { path: "$variations" } },
         { $match: { $and: [{ 'variations._VID': variationID }] } },
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
                        { case: { $eq: [areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                        { case: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                     ],
                     default: "$shipping.delivery.zonalCharge"
                  }
               },
               baseAmount: {
                  $add: [{ $multiply: ['$variations.pricing.sellingPrice', parseInt(quantity)] }, {
                     $switch: {
                        branches: [
                           { case: { $eq: [areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                           { case: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge" }
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

      if (product && typeof product !== 'undefined') {
         product = product[0];
         product["customerEmail"] = customerEmail;

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
            { user_email: authEmail },
            { $push: { orders: product } },
            { upsert: true }
         );

         if (result) {
            let availableUnits: number = (parseInt(product?.totalUnits) - parseInt(quantity)) || 0;

            const stock: string = availableUnits <= 0 ? "out" : "in";


            await Product.findOneAndUpdate(
               { _id: ObjectId(productID) },
               {
                  $set: {
                     "variations.$[i].available": availableUnits,
                     "variations.$[i].stock": stock
                  }
               },
               { arrayFilters: [{ "i._VID": variationID }] }
            );

            return res.status(200).send({ success: true, statusCode: 200, message: "Order Success." });
         }

      }
   } catch (error: any) {
      next(error)
   }
}


