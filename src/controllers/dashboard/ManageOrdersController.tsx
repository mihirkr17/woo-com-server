import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");


module.exports.manageOrders = async (req: Request, res: Response, next: NextFunction) => {
   try {
 
     const storeName = req.params.storeName;
     const uuid = req.decoded._UUID;
     let result: any;
 
     if (storeName) {
       result = await Order.aggregate([
         { $unwind: "$orders" },
         { $replaceRoot: { newRoot: "$orders" } },
         {
           $lookup: {
             from: 'products',
             localField: 'listingID',
             foreignField: "_LID",
             as: "main_product"
           }
         },
         { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
         {
           $match: {
             $and: [{ "sellerData.storeName": storeName }, { "sellerData.sellerID": uuid }],
           },
         },
         {
           $unset: [
             'bodyInfo', 'main_product',
             "modifiedAt", "paymentInfo",
             "variations", "_id", "tax", "save_as", "reviews",
             "ratingAverage", "_LID", "specification", "rating", "isVerified", "createdAt", "categories"
           ]
         }
       ]);
     };
 
     let newOrderCount = result && result.filter((o: any) => o?.orderStatus === "pending").length;
     let totalOrderCount = result && result.length;
 
 
 
     return res.status(200).send({ success: true, statusCode: 200, data: { module: result, newOrderCount, totalOrderCount } });
   } catch (error: any) {
     next(error);
   }
 };
 

 module.exports.dispatchOrder = async (req: Request, res: Response, next: NextFunction) => {
   try {
     const body = req.body;
 
     if (body?.context?.MARKET_PLACE !== "WooKart") {
       throw new Error("Invalid operation !");
     }
 
     if (!body?.module) {
       throw new Error("Invalid operation !");
     }
 
     const { trackingID, orderID, customerEmail } = body && body?.module;
 
     const timestamp = Date.now();
     let dispatchTime = {
       iso: new Date(timestamp),
       time: new Date(timestamp).toLocaleTimeString(),
       date: new Date(timestamp).toDateString(),
       timestamp: timestamp
     }
 
     await Order.findOneAndUpdate(
       { user_email: customerEmail },
       {
         $set: {
           "orders.$[i].orderStatus": "dispatch",
           "orders.$[i].orderDispatchAT": dispatchTime,
           "orders.$[i].isDispatch": true
         },
       },
       {
         arrayFilters: [{ "i.orderID": orderID, "i.trackingID": trackingID }],
       }
     );
 
     res.status(200).send({ success: true, statusCode: 200, message: "Successfully order dispatched" });
 
   } catch (error: any) {
     next(error);
   }
 };
 