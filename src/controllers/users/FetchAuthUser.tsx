import { NextFunction, Request, Response } from "express";
const { productCounter, findUserByEmail } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const { generateUserDataToken } = require("../../utils/generator");


module.exports = async function FetchAuthUser(req: Request, res: Response, next: NextFunction) {
   try {
      const authEmail = req.decoded.email;

      let userDataToken: any;

      // const ipAddress = req.socket?.remoteAddress;

      let user: any = await findUserByEmail(authEmail);

      if (!user || typeof user !== "object") throw new apiResponse.Api404Error("User not found !");

      if (user?.role && user?.role === "ADMIN") {
         userDataToken = generateUserDataToken({
            _uuid: user?._uuid,
            fullName: user?.fullName,
            email: user?.email,
            phone: user?.phone,
            phonePrefixCode: user?.phonePrefixCode,
            hasPassword: user?.hasPassword,
            role: user?.role,
            gender: user?.gender,
            dob: user?.dob,
            accountStatus: user?.accountStatus,
            contactEmail: user?.contactEmail,
            authProvider: user?.authProvider
         });
      }


      if (user?.role === 'SELLER' && user?.idFor === 'sell') {
         await productCounter({ storeName: user.seller.storeInfos?.storeName, _uuid: user?._uuid });

         userDataToken = generateUserDataToken({
            _uuid: user?._uuid,
            fullName: user?.fullName,
            email: user?.email,
            phone: user?.phone,
            phonePrefixCode: user?.phonePrefixCode,
            hasPassword: user?.hasPassword,
            role: user?.role,
            gender: user?.gender,
            dob: user?.dob,
            idFor: user?.idFor,
            isSeller: user?.isSeller,
            accountStatus: user?.accountStatus,
            contactEmail: user?.contactEmail,
            seller: user?.seller,
            authProvider: user?.authProvider
         });
      }

      if (user?.role === 'BUYER' && user?.idFor === 'buy') {

         user.buyer["defaultShippingAddress"] = (Array.isArray(user?.buyer?.shippingAddress) &&
            user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]) || {};

         userDataToken = generateUserDataToken({
            _uuid: user?._uuid,
            fullName: user?.fullName,
            email: user?.email,
            phone: user?.phone,
            phonePrefixCode: user?.phonePrefixCode,
            hasPassword: user?.hasPassword,
            role: user?.role,
            gender: user?.gender,
            dob: user?.dob,
            idFor: user?.idFor,
            accountStatus: user?.accountStatus,
            contactEmail: user?.contactEmail,
            buyer: user?.buyer,
            authProvider: user?.authProvider
         });
      }

      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: 'Welcome ' + user?.fullName,
         u_data: userDataToken
      });

   } catch (error: any) {
      next(error);
   }
};