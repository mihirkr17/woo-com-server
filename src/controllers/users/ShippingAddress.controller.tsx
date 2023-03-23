import { NextFunction, Request, Response } from "express";
const User = require("../../model/user.model");
const { findUserByEmail } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");

interface IShippingAddress {
   addrsID: string;
   name: string;
   division: string;
   city: string;
   area: string;
   area_type: string;
   landmark: string;
   phone_number: string;
   postal_code: string;
   default_shipping_address: boolean;
}

module.exports.createShippingAddress = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const userEmail: string = req.decoded.email;

      let body: any = req.body;

      if (!body || typeof body !== "object") throw new apiResponse.Api400Error("Required body !");

      if (!Object.values(body).some((e: any) => e !== null && e !== "")) {
         throw new apiResponse.Api400Error("Required all fields !");
      }

      const { name, division, city, area, area_type, landmark, phone_number, postal_code, default_shipping_address } = body;

      let shippingAddressModel: IShippingAddress = {
         addrsID: "spi_" + (Math.floor(Math.random() * 100000000)).toString(),
         name,
         division,
         city,
         area,
         area_type,
         landmark,
         phone_number,
         postal_code,
         default_shipping_address: default_shipping_address || false
      }

      const result = await User.findOneAndUpdate(
         { email: userEmail },
         { $push: { "buyer.shippingAddress": shippingAddressModel } },
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

      const userEmail: string = req.decoded.email;
      const body: any = req.body;

      if (!body || typeof body !== "object") throw new apiResponse.Api400Error("Required body !");

      if (!Object.values(body).some((e: any) => e !== null && e !== "")) {
         throw new apiResponse.Api400Error("Required all fields !");
      }

      const { addrsID, name, division, city, area, area_type, landmark, phone_number, postal_code, default_shipping_address } = body;

      if (!addrsID) throw new apiResponse.Api400Error("Required address id !");

      let shippingAddressModel: IShippingAddress = {
         addrsID,
         name,
         division,
         city,
         area,
         area_type,
         landmark,
         phone_number,
         postal_code,
         default_shipping_address
      }

      const result = await User.findOneAndUpdate(
         { email: userEmail },
         {
            $set: {
               "buyer.shippingAddress.$[i]": shippingAddressModel,
            },
         },
         { arrayFilters: [{ "i.addrsID": addrsID }] }
      );

      if (result) {
         return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Shipping address updated.",
         });
      } else {
         throw new apiResponse.Api500Error("Failed to update shipping address.");
      }
   } catch (error: any) {
      next(error);
   }
};


module.exports.selectShippingAddress = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const authEmail: string = req.decoded.email;
      let { addrsID, default_shipping_address } = req.body;

      if (!addrsID || typeof addrsID !== "string") throw new apiResponse.Api400Error("Required address id !");

      default_shipping_address = (default_shipping_address === true) ? false : true;

      const user = await findUserByEmail(authEmail);

      if (!user && typeof user !== "object") {
         throw new apiResponse.Api403Error('User not found !!!');
      }

      const shippingAddress = user?.buyer?.shippingAddress || [];

      if (shippingAddress && shippingAddress.length > 0) {

         const result = await User.findOneAndUpdate(
            { email: authEmail },
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

         if (!result) throw new apiResponse.Api500Error("Server error !");

         return res.status(200).send({ success: true, statusCode: 200, message: "Default shipping address selected." });
      }
   } catch (error: any) {
      next(error);
   }
}


module.exports.deleteShippingAddress = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const email: string = req.decoded.email;
      let addrsID: any = req.params.addrsID;

      if (!addrsID || typeof addrsID !== "string") throw new apiResponse.Api400Error("Required address id !");

      const result = await User.findOneAndUpdate({ email: email }, { $pull: { "buyer.shippingAddress": { addrsID } } });

      if (result) return res.status(200).send({ success: true, statusCode: 200, message: "Address deleted successfully." });
   } catch (error: any) {
      next(error);
   }
}