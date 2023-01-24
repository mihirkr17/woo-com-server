import { Request, Response } from "express";
const User = require("../../model/user.model");

module.exports.createShippingAddress = async (req: Request, res: Response) => {
   try {
      const userEmail = req.decoded.email;

      let body = req.body;

      body['_SA_UID'] = Math.floor(Math.random() * 100000000);
      body['default_shipping_address'] = false;

      const result = await User.updateOne(
            { email: userEmail },
            { $push: { "buyer.shippingAddress": body } },
            { new: true }
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


module.exports.updateShippingAddress = async (req: Request, res: Response) => {
   try {
      // const db = await dbc.dbConnection();

      const userEmail = req.decoded.email;
      const body = req.body;

      const result = await User.updateOne(
         { email: userEmail },
         {
            $set: {
               "buyer.shippingAddress.$[i]": body,
            },
         },
         { arrayFilters: [{ "i._SA_UID": body?._SA_UID }] }
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


module.exports.selectShippingAddress = async (req: Request, res: Response) => {
   try {
      // const db = await dbc.dbConnection();
      const userEmail = req.decoded.email;
      let { _SA_UID, default_shipping_address } = req.body;

      default_shipping_address = default_shipping_address === true ? false : true;

      const user = await User.findOne({ email: userEmail });

      if (!user) {
         return res.status(503).send({ success: false, statusCode: 503, error: 'User not found !!!' });
      }

      const shippingAddress = user?.buyer?.shippingAddress || [];

      if (shippingAddress && shippingAddress.length > 0) {

         const result = await User.updateOne(
            { email: userEmail },
            {
               $set: {
                  "buyer.shippingAddress.$[j].default_shipping_address": false,
                  "buyer.shippingAddress.$[i].default_shipping_address": default_shipping_address,
               },
            },
            {
               arrayFilters: [{ "j._SA_UID": { $ne: _SA_UID } }, { "i._SA_UID": _SA_UID }],
               multi: true,
            }
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
}


module.exports.deleteShippingAddress = async (req: Request, res: Response) => {
   try {
      // const db = await dbc.dbConnection();

      const email = req.decoded.email;
      const _SA_UID = parseInt(req.params._SA_UID);

      const result = await User.updateOne({ email: email }, { $pull: { "buyer.shippingAddress": { _SA_UID } } });

      if (result) return res.send(result);
   } catch (error: any) {
      res.status(500).send({ success: false, statusCode: 500, error: error?.message });
   }
}