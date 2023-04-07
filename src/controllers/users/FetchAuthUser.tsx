import { NextFunction, Request, Response } from "express";
const { productCounter, findUserByEmail } = require("../../services/common.service");
const ShoppingCart = require("../../model/shoppingCart.model");
const apiResponse = require("../../errors/apiResponse");
const setUserDataToken = require("../../utils/setUserDataToken");


module.exports = async function FetchAuthUser(req: Request, res: Response, next: NextFunction) {
   try {
      const authEmail = req.decoded.email;

      let userDataToken: any;

      // const ipAddress = req.socket?.remoteAddress;

      let user: any = await findUserByEmail(authEmail);

      if (!user || typeof user !== "object") throw new apiResponse.Api404Error("User not found !");

      if (user?.role === 'SELLER' && user?.idFor === 'sell') {
         await productCounter({ storeName: user.seller.storeInfos?.storeName, _uuid: user?._uuid });

         userDataToken = setUserDataToken({
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

         user.buyer["shoppingCartItems"] = await ShoppingCart.countDocuments({ customerEmail: user?.email }) || 0;

         userDataToken = setUserDataToken({
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