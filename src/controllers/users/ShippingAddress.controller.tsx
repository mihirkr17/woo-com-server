import { NextFunction, Request, Response } from "express";
const User = require("../../model/user.model");
const { findUserByEmail } = require("../../services/common.services");

module.exports.createShippingAddress = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const userEmail = req.decoded.email;

      let body = req.body;

      body['addrsID'] = Math.floor(Math.random() * 100000000);
      body['default_shipping_address'] = false;

      const result = await User.findOneAndUpdate(
         { email: userEmail },
         { $push: { "buyer.shippingAddress": body } },
         { upsert: true }
      );

      if (!result) {
         return res.status(400).send({
            success: false,
            statusCode: 400,
            message: "Failed to add address in this cart",
         });
      }

      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: "Successfully shipping address added in your cart.",
      });
   } catch (error: any) {
      next(error);
   }
};


module.exports.updateShippingAddress = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const userEmail = req.decoded.email;
      const body = req.body;

      const result = await User.updateOne(
         { email: userEmail },
         {
            $set: {
               "buyer.shippingAddress.$[i]": body,
            },
         },
         { arrayFilters: [{ "i.addrsID": body?.addrsID }] }
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
      next(error);
   }
};


module.exports.selectShippingAddress = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const userEmail = req.decoded.email;
      let { addrsID, default_shipping_address } = req.body;

      default_shipping_address = default_shipping_address === true ? false : true;

      const user = await findUserByEmail(userEmail);

      if (!user && typeof user !== "object") {
         return res.status(404).send({ success: false, statusCode: 404, message: 'User not found !!!' });
      }

      const shippingAddress = user?.buyer?.shippingAddress || [];

      if (shippingAddress && shippingAddress.length > 0) {

         const result = await User.findOneAndUpdate(
            { email: userEmail },
            {
               $set: {
                  "buyer.shippingAddress.$[j].default_shipping_address": false,
                  "buyer.shippingAddress.$[i].default_shipping_address": default_shipping_address,
               },
            },
            {
               arrayFilters: [{ "j.addrsID": { $ne: addrsID } }, { "i.addrsID": addrsID }],
               multi: true,
            }
         );

         if (!result) {
            return res.status(400).send({
               success: false,
               statusCode: 400,
               message: "Failed to select the address",
            });
         }

         return res.status(200).send({ success: true, statusCode: 200, message: "Shipping address Saved." });
      }
   } catch (error: any) {
      next(error);
   }
}


module.exports.deleteShippingAddress = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const email = req.decoded.email;
      let saUid: any = req.params.addrsID;

      if (!saUid) {
         return res.status(400).send({ success: false, statusCode: 400, message: "Required address id !" });
      }

      saUid = parseInt(saUid);

      const result = await User.findOneAndUpdate({ email: email }, { $pull: { "buyer.shippingAddress": { addrsID: saUid } } });

      if (result) return res.status(200).send({ success: true, statusCode: 200, message: "Address deleted successfully." })
   } catch (error: any) {
      next(error);
   }
}