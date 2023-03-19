import { NextFunction, Request, Response } from "express";
const { cartTemplate } = require("../../templates/cart.template");
const { checkProductAvailability } = require("../../services/common.services");
const ShoppingCart = require("../../model/shoppingCart.model");
const apiResponse = require("../../errors/apiResponse");
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

      if (!body || typeof body !== "object") {
         throw new apiResponse.Api400Error("Required body !");
      }

      const { productID, variationID, listingID, action } = body;

      if (!productID || !variationID || !listingID) {
         throw new apiResponse.Api400Error("Required product id, listing id, variation id in body !");
      }

      const availableProduct = await checkProductAvailability(productID, variationID);

      if (!availableProduct) {
         return res.status(503).send({ success: false, statusCode: 503, message: "Sorry! This product is out of stock now!" });
      }

      const cartTemp = cartTemplate(authEmail, productID, listingID, variationID);

      if (action === "toCart") {

         const existsProduct = await ShoppingCart.countDocuments(
            { $and: [{ customerEmail: authEmail }, { variationID: variationID }] }
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