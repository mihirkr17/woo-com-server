import { NextFunction, Request, Response } from "express";
const { productCounter } = require("../../model/common.model");
const User = require("../../model/user.model");
const ShoppingCart = require("../../model/shoppingCart.model");
const response = require("../../errors/apiResponse");


module.exports = async function FetchAuthUser(req: Request, res: Response, next: NextFunction) {
   try {
      const authEmail = req.decoded.email;
      const role: string = req.decoded.role;
      const UUID:string = req.decoded._UUID;
      const uuid: string = req.headers.authorization || "";
      let result: any;  

      const ipAddress = req.socket?.remoteAddress;

      // if uuid !== UUID then clear those cookies
      if (uuid !== UUID) {
         res.clearCookie("token");
         return res.status(401).send();
      }

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

      return res.status(200).send({ success: true, statusCode: 200, message: 'Welcome ' + result?.fullName, data: result, ipAddress });

   } catch (error: any) {
      next(error);
   }
};