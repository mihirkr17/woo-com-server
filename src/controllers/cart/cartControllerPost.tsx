import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const { cartTemplate } = require("../../templates/cart.template");

const checkProductAvailability = async (productId: string, variationId: String) => {
   const db = await dbConnection();

   let product = await db.collection('products').aggregate([
      { $match: { _id: ObjectId(productId) } },
      { $unwind: { path: "$variations" } },
      { $match: { $and: [{ 'variations._vId': variationId }, { 'variations.available': { $gte: 1 } }, { 'variations.stock': 'in' }] } }
   ]).toArray();

   product = product[0];
   return product;
};

// add to cart controller
/**
 * @controller --> add product to cart
 * @required --> BODY [productId, variationId]
 * @request_method --> POST
 */
module.exports.addToCartHandler = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const authEmail: string = req.decoded.email;
      const body = req.body;

      const availableProduct = await checkProductAvailability(body?.productId, body?.variationId);

      if (!availableProduct) {
         return res.status(503).send({ success: false, statusCode: 503, error: "Sorry! This product is out of stock now!" });
      }

      const existsProduct = await db.collection("shoppingCarts").findOne(
         { $and: [{ customerEmail: authEmail }, { variationId: body?.variationId }] }
      );

      if (existsProduct) {
         return res.status(400).send({ success: false, statusCode: 400, error: "Product Has Already In Your Cart!" });
      }

      const cartTemp = cartTemplate(availableProduct, authEmail, body?.productId, body?.listingId, body?.variationId);

      const result = await db.collection('shoppingCarts').insertOne(cartTemp);

      const countCartItems = await db.collection("shoppingCarts").countDocuments({customerEmail: authEmail});

      if (result) {
         res.cookie("cart_p", countCartItems, { httpOnly: false, maxAge: 57600000 });
         return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });
      }

   } catch (error: any) {
      return res.status(500).send({ success: false, statusCode: 500, error: error?.message });
   }
};


module.exports.addCartAddress = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const userEmail = req.decoded.email;

      let body = req.body;
      body['_SA_UID'] = Math.floor(Math.random() * 100000000);
      body['select_address'] = false;

      const result = await db
         .collection("users")
         .updateOne(
            { email: userEmail },
            { $push: { shippingAddress: body } },
            { upsert: true }
         );

      if (!result) {
         return res.status(400).send({
            success: false,
            statusCode: 400,
            error: "Failed to add address in this cart",
         });
      }

      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: "Successfully shipping address added in your cart.",
      });
   } catch (error: any) {
      res.status(500).send({ message: error?.message });
   }
};