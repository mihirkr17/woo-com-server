import { NextFunction, Request, Response } from "express";
const { cartTemplate } = require("../../templates/cart.template");
const { checkProductAvailability } = require("../../model/common.model");
const ShoppingCart = require("../../model/shoppingCart.model");

// add to cart controller
/**
 * @controller --> add product to cart
 * @required --> BODY [productId, variationId]
 * @request_method --> POST
 */
module.exports.addToCartHandler = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const authEmail: string = req.decoded.email;
      const body = req.body;
      let countCartItems: number = 0;

      const availableProduct = await checkProductAvailability(body?.productId, body?.variationId);

      if (!availableProduct) {
         return res.status(503).send({ success: false, statusCode: 503, error: "Sorry! This product is out of stock now!" });
      }

      const existsProduct = await ShoppingCart.findOne(
         { $and: [{ customerEmail: authEmail }, { variationId: body?.variationId }] }
      );

      if (existsProduct) {
         return res.status(400).send({ success: false, statusCode: 400, error: "Product Has Already In Your Cart!" });
      }

      const cartTemp = cartTemplate(authEmail, body?.productId, body?.listingId, body?.variationId);

      let cart = new ShoppingCart(cartTemp);
      let result = await cart.save();

      if (result?._id) {

         // counting items in shopping cart
         countCartItems = await ShoppingCart.countDocuments({ customerEmail: authEmail });

         // after counting set this on cookie as a cart product
         res.cookie("cart_p", countCartItems, { httpOnly: false, maxAge: 57600000 });

         // and then send the success response to the clients.
         return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });
      }
   } catch (error: any) {
      next(error);
   }
};