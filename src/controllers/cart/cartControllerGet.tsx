import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");


// Show My Cart Items;
module.exports.showMyCartItemsController = async (req: Request, res: Response) => {
   try {
     const db = await dbConnection();
 
     const authEmail = req.decoded.email;
 
     const cartItems = await db.collection('shoppingCarts').find({ customerEmail: authEmail }).toArray();
 
     const result = await db.collection('shoppingCarts').aggregate([
       { $match: { customerEmail: authEmail } },
       {
         $lookup: {
           from: 'products',
           localField: 'listingId',
           foreignField: "_lId",
           as: "main_product"
         }
       },
       {
         $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } }
       },
       { $project: { main_product: 0 } },
       { $unwind: { path: "$variations" } },
       {
         $match: {
           $expr: {
             $and: [
               { $eq: ['$variations.vId', '$variationId'] }
             ]
           }
         }
       },
       {
         $project: {
           listingId: 1,
           productId: 1, variationId: 1, variations: 1, brand: 1, 
           quantity: 1, 
           totalAmount: { $multiply: ['$variations.pricing.sellingPrice', '$quantity'] },
           seller: 1,
           shippingCharge: "$deliveryDetails.zonalDeliveryCharge",
           paymentInfo: 1
         }
       }
     ]).toArray();
 
     if (cartItems) {
       return res.status(200).send({ success: true, statusCode: 200, data: { items: cartItems.length, products: result, result: result } });
     }
   } catch (error: any) {
     return res.status(500).send({ success: false, statusCode: 500, error: error?.message })
   }
 }