import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const ShoppingCart = require("../../model/shoppingCart.model");


/**
 * @controller --> Delete cart items by product ID
 * @request_method --> DELETE
 * @required --> productID:req.headers.authorization & cartTypes:req.params
 */
module.exports.deleteCartItem = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const productID = req.headers.authorization;
      const authEmail = req.decoded.email;
      const cart_types = req.params.cartTypes;
      let updateDocuments;

      if (!ObjectId.isValid(productID) || !productID) {
         return res.status(500).send({ success: false, statusCode: 500, message: "headers missing!!!" });
      }

      if (cart_types === "toCart") {
         updateDocuments = await ShoppingCart.deleteOne({ $and: [{ customerEmail: authEmail }, { productID }] })
      }

      if (updateDocuments) {
         return res.status(200).send({ success: true, statusCode: 200, message: "Item removed successfully from your cart." });
      }
      return res.status(500).send({ success: false, statusCode: 500, message: "Sorry! failed to remove!!!" });

   } catch (error: any) {
      next(error);
   }
};
