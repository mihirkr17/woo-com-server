import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");


module.exports = async function setOrderHandler(req: Request, res: Response, next: NextFunction) {
   try {

      const userEmail: string = req.headers.authorization || "";
      const verifiedEmail: string = req.decoded.email;
      const customerUUID: string = req.decoded._UUID;
      const body: any = req.body;

      if (userEmail !== verifiedEmail) {
         return res.status(401).send({ success: false, statusCode: 401, message: "Unauthorized access" });
      }

      if (!body || typeof body === "undefined") {
         return res.status(400).send({
            success: false,
            statusCode: 400,
            error: "Something went wrong !",
         });
      }

      async function setOrder(item: any) {
         let productInventor;
         productInventor = await Product.aggregate([
            { $match: { $and: [{ _LID: item?.listingID }, { _id: ObjectId(item?.productID) }] } },
            { $unwind: { path: "$variations" } },
            { $replaceRoot: { newRoot: { $mergeObjects: ["$variations", "$$ROOT"] } } },
            { $unset: ["variations"] },
            { $match: { $and: [{ _VID: item?.variationID }] } },
            {
               $project: {
                  vr: {
                     $cond: {
                        if: { $gte: ["$available", item?.quantity] }, then: "yes", else: "no"
                     },

                  },
                  available: 1,
                  sellingPrice: "$pricing.sellingPrice",
                  totalAmount: {
                     $add: [
                        { $multiply: ['$pricing.sellingPrice', parseInt(item?.quantity)] },
                        {
                           $switch: {
                              branches: [
                                 { case: { $eq: [item.shippingAddress.area_type, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                                 { case: { $eq: [item.shippingAddress.area_type, "local"] }, then: "$shipping.delivery.localCharge" }
                              ],
                              default: "$shipping.delivery.zonalCharge"
                           }
                        }
                     ]
                  },
                  sellerData: 1,
                  shippingCharge: {
                     $switch: {
                        branches: [
                           { case: { $eq: [item.shippingAddress.area_type, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                           { case: { $eq: [item.shippingAddress.area_type, "local"] }, then: "$shipping.delivery.localCharge" }
                        ],
                        default: "$shipping.delivery.zonalCharge"
                     }
                  },
               }
            }
         ]);

         productInventor = productInventor[0];

         if (productInventor && productInventor?.vr === "yes") {

            item["shippingCharge"] = productInventor?.shippingCharge;
            item["totalAmount"] = productInventor?.totalAmount;
            item["sellerData"] = productInventor?.sellerData;
            item["sellingPrice"] = productInventor?.sellingPrice;
            item["orderID"] = "#" + (Math.round(Math.random() * 999999999) + productInventor?.available).toString();
            item["trackingID"] = "TRC" + (Math.round(Math.random() * 9999999)).toString();
            
            const timestamp = Date.now();

            item["orderAT"] = {
               iso: new Date(timestamp),
               time: new Date(timestamp).toLocaleTimeString(),
               date: new Date(timestamp).toDateString(),
               timestamp: timestamp
            }
            item["customerID"] = customerUUID;
            item["orderStatus"] = "pending";

            let result = await Order.findOneAndUpdate(
               { user_email: userEmail },
               { $push: { orders: item } },
               { upsert: true }
            );

            if (result) {
               let availableProduct = productInventor?.available;
               let restAvailable = availableProduct - item?.quantity;
               let stock = restAvailable <= 1 ? "out" : "in";

               await Product.findOneAndUpdate(
                  { _id: ObjectId(item?.productID) },
                  {
                     $set: {
                        "variations.$[i].available": restAvailable,
                        "variations.$[i].stock": stock
                     }
                  },
                  { arrayFilters: [{ "i._VID": item?.variationID }] }
               );

               return { orderSuccess: true, message: "Order success for " + item?.title };
            }

         } else {
            return { orderSuccess: false, message: "Sorry, Order failed for " + item?.title + " due to quantity greater than total units !" };
         }
      }

      const promises: any = Array.isArray(body) && body.map(async (b: any) => {
         return await setOrder(b);
      });

      let finalResult: any = await Promise.all(promises);

      return res.status(200).send({ success: true, statusCode: 200, data: finalResult });
   } catch (error: any) {
      next(error);
   }
};