import { NextFunction, Request, Response } from "express";
const { productCounter, findUserByEmail } = require("../../services/common.services");
const ShoppingCart = require("../../model/shoppingCart.model");
const apiResponse = require("../../errors/apiResponse");
const setUserDataToken = require("../../utils/setUserDataToken");


module.exports = async function FetchAuthUser(req: Request, res: Response, next: NextFunction) {
   try {
      const authEmail = req.decoded.email;
      let user: any;
      let userDataToken: any;

      const ipAddress = req.socket?.remoteAddress;

      user = await findUserByEmail(authEmail);

      if (!user || typeof user !== "object") {
         throw new apiResponse.Api404Error("User not found !");
      }


      if (user && user?.role === 'SELLER' && user?.idFor === 'sell') {
         await productCounter({ storeName: user.seller.storeInfos?.storeName, _uuid: user?._uuid });
      }

      if (user && user?.role === 'BUYER' && user?.idFor === 'buy') {

         user.buyer["defaultShippingAddress"] = (Array.isArray(user?.buyer?.shippingAddress) &&
            user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]) || {};

         user.buyer["shoppingCartItems"] = await ShoppingCart.find({ customerEmail: user?.email }) || [];

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
            buyer: user?.buyer
         });
      }

      return res.status(200).send({ success: true, statusCode: 200, message: 'Welcome ' + user?.fullName, data: user, ipAddress, u_data: userDataToken });

   } catch (error: any) {
      next(error);
   }
};