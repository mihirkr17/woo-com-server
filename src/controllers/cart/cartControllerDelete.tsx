import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");


/**
 * @controller --> Delete cart items by product ID
 * @request_method --> DELETE
 * @required --> productID:req.headers.authorization & cartTypes:req.params
 */
module.exports.deleteCartItem = async (req: Request, res: Response) => {
   try {
      const productID = req.headers.authorization;
      const authEmail = req.decoded.email;
      const cart_types = req.params.cartTypes;
      let updateDocuments;

      const db = await dbConnection();

      if (!ObjectId.isValid(productID) || !productID) {
         return res.status(500).send({ success: false, statusCode: 500, message: "headers missing!!!" });
      }

      if (cart_types === "toCart") {
         updateDocuments = await db.collection('shoppingCarts').deleteOne({ $and: [{ customerEmail: authEmail }, { productID }] })
      }

      if (updateDocuments) {
         const countCartItems = await db.collection("shoppingCarts").countDocuments({ customerEmail: authEmail });
         res.cookie("cart_p", countCartItems, { httpOnly: false, maxAge: 57600000 });
         return res.status(200).send({ success: true, statusCode: 200, message: "Item removed successfully from your cart." });
      }
      return res.status(500).send({ success: false, statusCode: 500, message: "Sorry! failed to remove!!!" });



   } catch (error: any) {
      res.status(500).send({ message: error?.message });
   }
};

module.exports.deleteCartAddress = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const email = req.decoded.email;
      const addressId = parseInt(req.params.addressId);
      const result = await db
         .collection("users")
         .updateOne({ email: email }, { $pull: { shippingAddress: { addressId } } });
      if (result) return res.send(result);
   } catch (error: any) {
      res.status(500).send({ message: error?.message });
   }
};