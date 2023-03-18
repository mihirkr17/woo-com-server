import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const ShoppingCart = require("../../model/shoppingCart.model");
const User = require("../../model/user.model");
const Product = require("../../model/product.model");
const { checkProductAvailability } = require("../../services/common.services");


module.exports.updateCartProductQuantityController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      let cartProduct: any;
      let result: any;

      const authEmail = req.decoded.email || "";

      const body = req.body;

      const cartType = body?.actionRequestContext?.type;

      const upsertRequest = body?.upsertRequest;

      const cartContext = upsertRequest?.cartContext;

      const { productID, variationID, cartID, quantity } = cartContext;

      if (cartType === 'toCart') {
         cartProduct = await ShoppingCart.findOne({ $and: [{ customerEmail: authEmail }, { productID }, { _id: ObjectId(cartID) }] });

         if (!cartProduct) {
            return res.status(404).send({ success: false, statusCode: 404, error: 'product not found !!!' });
         }
      }

      const productAvailability = await checkProductAvailability(productID, variationID);

      if (!productAvailability || typeof productAvailability === "undefined" || productAvailability === null) {
         return res.status(400).send({ success: false, statusCode: 400, error: "Product not available" });
      }

      if (parseInt(quantity) >= productAvailability?.variations?.available) {
         return res.status(200).send({ success: false, statusCode: 200, message: "Sorry ! your selected quantity out of range." });
      }

      if (cartType === 'toCart') {
         result = await ShoppingCart.updateOne(
            {
               $and: [{ customerEmail: authEmail }, { productID }, { _id: ObjectId(cartID) }]
            },
            {
               $set: {
                  quantity,
               }
            },
            {
               upsert: true,
            }
         );
      }

      if (cartType === "buy") {
         result = await User.updateOne(
            {
               email: authEmail
            },
            {
               $set: {
                  "buyer.buyProduct.quantity": quantity,
               }
            },
            {
               upsert: true,
            }
         );
      }

      if (result) {
         return res.status(200).send({ success: true, statusCode: 200, message: `Quantity updated to ${quantity}.` });
      }

   } catch (error: any) {
      next(error);
   }
}


module.exports.updateCartAddress = async (req: Request, res: Response) => {
   try {
      const userEmail = req.decoded.email;
      const body = req.body;

      const result = await User.findOneAndUpdate(
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