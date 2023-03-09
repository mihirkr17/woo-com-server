import { NextFunction, Request, Response } from "express";
const { cartTemplate } = require("../../templates/cart.template");
const { checkProductAvailability } = require("../../model/common.model");
const ShoppingCart = require("../../model/shoppingCart.model");
// add to cart controller
/**
 * @controller --> add product to cart
 * @required --> BODY [productID, variationID]
 * @request_method --> POST
 */
module.exports.addToCartHandler = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const authEmail: string = req.decoded.email;
      const body = req.body;
      let cart: any;

      const availableProduct = await checkProductAvailability(body?.productID, body?.variationID);

      if (!availableProduct) {
         return res.status(503).send({ success: false, statusCode: 503, message: "Sorry! This product is out of stock now!" });
      }

      const cartTemp = cartTemplate(authEmail, body?.productID, body?.listingID, body?.variationID);

      if (body?.action === "toCart") {

         const existsProduct = await ShoppingCart.countDocuments(
            { $and: [{ customerEmail: authEmail }, { variationID: body?.variationID }] }
         );

         if (existsProduct >= 1) {
            return res.status(400).send({ success: false, statusCode: 400, message: "Product Has Already In Your Cart!" });
         }

         cart = new ShoppingCart(cartTemp);

         let result = await cart.save();

         if (result?._id) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });
         }
      }

   } catch (error: any) {
      next(error);
   }
};