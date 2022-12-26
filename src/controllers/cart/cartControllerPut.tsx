import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");

const checkProductAvailability = async (productId: string, variationId: String) => {
   const db = await dbConnection();

   let product = await db.collection('products').aggregate([
      { $match: { _id: ObjectId(productId) } },
      { $unwind: { path: "$variations" } },
      {
         $match: {
            $and: [
               { 'variations.vId': variationId },
               { 'variations.available': { $gte: 1 } },
               { 'variations.stock': 'in' }]
         }
      }
   ]).toArray();

   product = product[0];
   return product;
};


module.exports.addToBuyHandler = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const userEmail = req.decoded.email;
      const body = req.body;

      const cartRes = await db
         .collection("users")
         .updateOne(
            { email: userEmail },
            { $set: { buy_product: body } },
            { upsert: true }
         );

      if (cartRes) {
         return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Product ready to buy.",
         });
      } else {
         return res
            .status(400)
            .send({ success: false, statusCode: 400, error: "Failed to buy" });
      }
   } catch (error: any) {
      res.status(500).send({ message: error?.message });
   }
};



module.exports.updateCartProductQuantityController = async (req: Request, res: Response) => {
   try {

      const db = await dbConnection();

      const authEmail = req.decoded.email || "";

      const body = req.body;

      const upsertRequest = body?.upsertRequest;

      const cartContext = upsertRequest?.cartContext;

      const { productId, variationId, cartId, quantity } = cartContext;

      const cartProduct = await db.collection('shoppingCarts').findOne({ $and: [{ customerEmail: authEmail }, { productId }, { _id: ObjectId(cartId) }] });

      if (!cartProduct) {
         return res.status(404).send({ success: false, statusCode: 404, error: 'product not found !!!' });
      }

      const availableProduct = await checkProductAvailability(productId, variationId);

      if (!availableProduct || typeof availableProduct === "undefined" || availableProduct === null) {
         return res.status(400).send({ success: false, statusCode: 400, error: "Product not available" });
      }

      if (parseInt(quantity) >= availableProduct?.variations?.available) {
         return res.status(400).send({ success: false, statusCode: 400, error: "Sorry ! your selected quantity out of range." });
      }


      // let price = parseFloat(cartProduct?.price) || 0;

      // let amount = (price * quantity);

      const result = await db.collection('shoppingCarts').updateOne(
         {
            $and: [{ customerEmail: authEmail }, { productId }, { _id: ObjectId(cartId) }]
         },
         {
            $set: {
               quantity,
               // totalAmount: amount
            }
         },
         {
            upsert: true,
         }
      );


      if (result) {
         return res.status(200).send({ success: true, statusCode: 200, message: 'Quantity updated.' });
      }

   } catch (error: any) {
      return res.status(500).send({ success: false, statusCode: 500, error: error?.message });
   }
}


module.exports.updateCartAddress = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const userEmail = req.decoded.email;
      const body = req.body;

      const result = await db.collection("users").updateOne(
         { email: userEmail },
         {
            $set: {
               "shippingAddress.$[i]": body,
            },
         },
         { arrayFilters: [{ "i.addressId": body?.addressId }] }
      );

      if (result) {
         return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Shipping address updated.",
         });
      } else {
         return res.status(400).send({
            success: false,
            statusCode: 400,
            error: "Failed to update shipping address.",
         });
      }
   } catch (error: any) {
      res.status(500).send({ message: error?.message });
   }
};


module.exports.selectCartAddress = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();
      const userEmail = req.decoded.email;
      const { addressId, select_address } = req.body;

      const user = await db.collection("users").findOne({ email: userEmail });

      if (!user) {
         return res.status(404).send({ success: false, statusCode: 404, error: 'User not found !!!' });
      }

      const shippingAddress = user?.shippingAddress || [];

      if (shippingAddress && shippingAddress.length > 0) {

         await db.collection("users").updateOne(
            { email: userEmail },
            {
               $set: {
                  "shippingAddress.$[j].select_address": false,
               },
            },
            {
               arrayFilters: [{ "j.addressId": { $ne: addressId } }],
               multi: true,
            }
         );

         const result = await db.collection("users").updateOne(
            { email: userEmail },
            {
               $set: {
                  "shippingAddress.$[i].select_address": select_address,
               },
            },
            { arrayFilters: [{ "i.addressId": addressId }] }
         );

         if (!result) {
            return res.status(400).send({
               success: false,
               statusCode: 400,
               error: "Failed to select the address",
            });
         }

         return res.status(200).send({ success: true, statusCode: 200, message: "Shipping address Saved." });
      }
   } catch (error: any) {
      res.status(500).send({ success: false, statusCode: 500, error: error?.message });
   }
};