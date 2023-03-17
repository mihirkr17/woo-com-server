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
      let user: any;

      const ipAddress = req.socket?.remoteAddress;

      user = await User.findOne(
         {
            $and: [{ email: authEmail }, { role: role }, { accountStatus: 'active' }]
         },
         {
            password: 0, createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
         }
      );

      if (!user || typeof user !== "object") {
         throw new response.Api404Error("AuthError", "User not found !");
      }


      if (user && user?.role === 'SELLER' && user?.idFor === 'sell') {
         await productCounter({ storeName: user.seller.storeInfos?.storeName, _UUID: user?._UUID });
      }

      if (user && user?.role === 'BUYER' && user?.idFor === 'buy') {

         user.buyer["defaultShippingAddress"] = (Array.isArray(user?.buyer?.shippingAddress) &&
            user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

         user.buyer["shoppingCartItems"] = await ShoppingCart.countDocuments({ customerEmail: user?.email }) || 0;
      }

      let newUser = {
         _UUID: user?._UUID,
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
         authProvider: user?.authProvider,
         contactEmail: user?.contactEmail,
         buyer: user?.buyer
      };


      let userDataToken = setUserDataToken(newUser);

      res.cookie("u_data", userDataToken, { httpOnly: false, maxAge: 57600000, secure: true, sameSite: "none" });

      return res.status(200).send({ success: true, statusCode: 200, message: 'Welcome ' + user?.fullName, data: user, ipAddress, u_data: userDataToken });

   } catch (error: any) {
      next(error);
   }
};