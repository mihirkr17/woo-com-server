import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const User = require("../../model/user.model");



module.exports.updateProfileData = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();
      const email: string = req.decoded.email;
      const result = await db
         .collection("users")
         .updateOne({ email: email }, { $set: req.body }, { upsert: true });
      res.status(200).send(result);
   } catch (error: any) {
      res.status(500).send({ error: error?.message });
   }
};



module.exports.makeAdmin = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const userId: string = req.params.userId;

      if (!ObjectId.isValid(userId)) {
         return res
            .status(400)
            .send({ success: false, error: "User ID not valid" });
      }

      const result = await db
         .collection("users")
         .updateOne(
            { _id: ObjectId(userId) },
            { $set: { role: "admin" } },
            { upsert: true }
         );

      return result
         ? res.status(200).send({ success: true, message: "Permission granted" })
         : res.status(500).send({ success: false, error: "Failed" });
   } catch (error: any) {
      res.status(500).send({ message: error?.message });
   }
};


module.exports.demoteToUser = async (
   req: Request,
   res: Response,
   next: any
) => {
   try {
      const db = await dbConnection();

      const userId: string = req.params.userId;

      if (!ObjectId.isValid(userId)) {
         return res.status(400).send({ error: "User Id is not valid" });
      }

      res
         .status(200)
         .send(
            await db
               .collection("users")
               .updateOne(
                  { _id: ObjectId(userId) },
                  { $set: { role: "user" } },
                  { upsert: true }
               )
         );
   } catch (error: any) {
      next(error);
   }
};






module.exports.makeSellerRequest = async (req: Request, res: Response) => {
   try {
      const authEmail = req.decoded.email;
      const authRole = req.decoded.role;

      let user = await User.findOne({ $and: [{ email: authEmail }, { role: 'user' }] });

      if (!user) {
         return res.status(404).send({ success: false, statusCode: 404, error: 'User not found' });
      }

      if (user?.isSeller === 'pending') {
         return res.status(200).send({
            success: false,
            statusCode: 200,
            error: 'You already send a seller request. We are working for your request, and it will take sometime to verify'
         });
      }

      let body = req.body;

      let businessInfo = {
         taxID: body?.taxID,
         stateTaxID: body?.stateTaxID,
         creditCard: body?.creditCard,
      }

      let sellerInfo = {
         fName: body?.fName,
         lName: body?.lName,
         dateOfBirth: body?.dateOfBirth,
         phone: body?.phone,
         address: {
            street: body?.street,
            thana: body?.thana,
            district: body?.district,
            state: body?.state,
            country: body?.country,
            pinCode: body?.pinCode
         }
      }

      let inventoryInfo = {
         earn: 0,
         totalSell: 0,
         totalProducts: 0,
         storeName: body?.storeName,
         storeCategory: body?.categories,
         storeAddress: {
            street: body?.street,
            thana: body?.thana,
            district: body?.district,
            state: body?.state,
            country: body?.country,
            pinCode: body?.pinCode
         }
      }

      let isUpdate = await User.updateOne(
         { $and: [{ email: authEmail }, { role: authRole }] },
         { $set: { businessInfo, sellerInfo, inventoryInfo, isSeller: 'pending' } },
         { new: true }
      );

      if (isUpdate) {
         return res
            .status(200)
            .send({ success: true, statusCode: 200, message: "Thanks for sending a seller request. We are working for your request" });
      }

   } catch (error: any) {
      res.status(400).send({ success: false, statusCode: 400, error: error?.message });
   }
};



// Permit the seller request
module.exports.permitSellerRequest = async (req: Request, res: Response) => {
   try {
      const userId = req.headers.authorization?.split(',')[0];
      const userEmail = req.headers.authorization?.split(',')[1];

      const user = await User.findOne({ $and: [{ email: userEmail }, { _id: userId }, { isSeller: 'pending' }] });

      if (!user) {
         return res.status(400).send({ success: false, statusCode: 400, error: 'Sorry! request user not found.' });
      }

      let result = await User.updateOne(
         { email: userEmail },
         {
            $set: { role: "seller", isSeller: 'fulfilled', becomeSellerAt: new Date() },
            $unset: { shoppingCartItems: 1, shippingAddress: 1 }
         },
         { new: true }
      );

      result?.acknowledged
         ? res.status(200).send({ success: true, statusCode: 200, message: "Request Success" })
         : res.status(400).send({ success: false, statusCode: 400, error: "Bad Request" });

   } catch (error: any) {
      res.status(500).send({ success: false, statusCode: 500, error: error?.message });
   }
};
