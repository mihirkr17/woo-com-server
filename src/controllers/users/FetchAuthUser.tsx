import { NextFunction, Request, Response } from "express";
const { productCounter } = require("../../model/common.model");
const User = require("../../model/user.model");
const ShoppingCart = require("../../model/shoppingCart.model");
const response = require("../../errors/apiResponse");
const setUserDataToken = require("../../utils/setUserDataToken");


module.exports = async function FetchAuthUser(req: Request, res: Response, next: NextFunction) {
   try {
      const authEmail = req.decoded.email;
      const role: string = req.decoded.role;
      const UUID: string = req.decoded._UUID;
      const uuid: string = req.headers.authorization || "";
      let result: any;

      const ipAddress = req.socket?.remoteAddress;

      result = await User.findOne(
         {
            $and: [{ email: authEmail }, { role: role }, { accountStatus: 'active' }]
         },
         {
            password: 0, createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
         }
      );


      if (result && result?.role === 'SELLER' && result?.idFor === 'sell') {
         await productCounter({ storeName: result.seller.storeInfos?.storeName, _UUID: result?._UUID });
      }

      if (result && result?.role === 'BUYER' && result?.idFor === 'buy') {

         result.buyer["defaultShippingAddress"] = (Array.isArray(result?.buyer?.shippingAddress) &&
            result?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

         result.buyer["shoppingCartItems"] = await ShoppingCart.countDocuments({ customerEmail: result?.email });
      }

      if (!result || typeof result !== "object") {
         throw new response.Api404Error("AuthError", "User not found !");
      }


      let user = {
         _UUID: result?._UUID,
         fullName: result?.fullName,
         email: result?.email,
         phone: result?.phone,
         phonePrefixCode: result?.phonePrefixCode,
         hasPassword: result?.hasPassword,
         role: result?.role,
         gender: result?.gender,
         dob: result?.dob,
         idFor: result?.idFor,
         accountStatus: result?.accountStatus,
         authProvider: result?.authProvider,
         contactEmail: result?.contactEmail,
         buyer: result?.buyer
      };

      res.cookie("u_data", setUserDataToken(user), { httpOnly: false, maxAge: 57600000, sameSite: "none", secure: false });

      return res.status(200).send({ success: true, statusCode: 200, message: 'Welcome ' + result?.fullName, data: user, ipAddress });

   } catch (error: any) {
      next(error);
   }
};