// authentication.tsx

import { NextFunction, Request, Response } from "express";
const User = require("../../model/user.model");
const generateVerifyToken = require("../../utils/generateVerifyToken");
const apiResponse = require("../../errors/apiResponse");
const setToken = require("../../utils/setToken");
const comparePassword = require("../../utils/comparePassword");
const setUserDataToken = require("../../utils/setUserDataToken");
const ShoppingCart = require("../../model/shoppingCart.model");
const bcrypt = require("bcrypt");
const saltRounds = 10;

/**
 * @apiController --> Buyer Registration Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.buyerRegistrationController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      let body = req.body;

      let existUser = await User.findOne({ $or: [{ phone: body?.phone }, { email: body.email }] });

      if (existUser) {
         throw new apiResponse.Api400Error("AuthError", "User already exists, Please try another phone number or email address !");
      }

      body['_UUID'] = Math.random().toString(36).toUpperCase().slice(2, 18);
      body['verifyToken'] = generateVerifyToken();
      body['idFor'] = 'buy';
      body["buyer"] = {};

      let user = new User(body);

      const result = await user.save();

      if (!result) {
         throw new apiResponse.Api500Error("ServerError", "Something went wrong !");
      }

      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: "Registration success. Please verify your account.",
         data: { phone: result?.phone, verifyToken: result?.verifyToken, email: result?.email }
      });
   } catch (error: any) {
      next(error);
   }
};



/**
 * @apiController --> Seller Registration Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.sellerRegistrationController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      let body = req.body;

      let existUser = await User.findOne({ $or: [{ email: body.email }, { phone: body.phone }] });

      if (existUser) {
         throw new apiResponse.Api400Error("RegistrationError", "User already exists, Please try another phone number or email address !")
      }

      body['_UUID'] = Math.random().toString(36).toUpperCase().slice(2, 18);
      body['authProvider'] = 'system';
      body['isSeller'] = 'pending';
      body['idFor'] = 'sell';
      body["seller"] = {};

      let user = new User(body);

      const result = await user.save();

      if (!result) {
         throw new apiResponse.Api500Error("ServerError", "Something went wrong !");
      }

      res.cookie("verifyToken", result?.verifyToken, { maxAge: 3600000, httpOnly: false });

      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: "Registration success. Please verify your account.",
         data: { username: result?.username, verifyToken: result?.verifyToken, email: result?.email }
      });
   } catch (error: any) {
      next(error);
   }
};


/**
 * @controller --> registration verify by token
 */
module.exports.userVerifyTokenController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const verify_token = req.headers.authorization?.split(' ')[1] || undefined;

      const existUser = await User.findOne({ verifyToken: verify_token });

      if (!existUser) {
         throw new apiResponse.Api404Error("AuthError", "Sorry, User not found !");
      }

      if (existUser.verifyToken && !verify_token) {
         return res.status(200).send({ success: true, statusCode: 200, message: 'Verify token send....', verifyToken: existUser.verifyToken });
      }

      // next condition
      if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {

         if (existUser?.verifyToken !== verify_token) {
            throw new apiResponse.Api400Error("TokenError", "Invalid verify token !")
         }

         await User.findOneAndUpdate(
            { verifyToken: verify_token },
            {
               $unset: { verifyToken: 1 },
               $set: { accountStatus: 'active' }
            }
         );

         return res.status(200).send({ success: true, statusCode: 200, message: "User verified.", data: { email: existUser?.email } });
      }
   } catch (error) {
      next(error);
   }
}



/**
 * @apiController --> All User Login Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.loginController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { emailOrPhone, password, authProvider } = req.body;
      let token: String;
      let userDataToken: any;
      let userData;
      let provider: String;

      const cookieObject: any = {
         sameSite: "none",
         secure: true,
         maxAge: 57600000, // 16hr [3600000 -> 1hr]ms
         httpOnly: true,
         domain: "https://wookart.vercel.app/"
      };

      if (typeof authProvider === 'undefined' || !authProvider) {
         provider = 'system';
      } else {
         provider = authProvider;
      }

      const existUser = await User.findOne({
         $and: [
            { $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
            { authProvider: provider }
         ]
      });

      /// third party login system like --> Google
      if (authProvider === 'thirdParty') {

         if (!existUser || typeof existUser === 'undefined') {
            const UUID = Math.random().toString(36).toUpperCase().slice(2, 18);

            const user = new User({ _UUID: UUID, email: emailOrPhone, authProvider, accountStatus: 'active' });
            userData = await user.save();

         } else {
            userData = existUser;
         }

         token = setToken(userData);
      }

      // system login
      else {

         if (!existUser) {
            throw new apiResponse.Api400Error("LoginError", `User with ${emailOrPhone} not found!`);
         }

         let comparedPassword = await comparePassword(password, existUser?.password);

         if (!comparedPassword) {
            throw new apiResponse.Api400Error("LoginError", "Password didn't match !");
         }

         if (existUser.verifyToken && existUser?.accountStatus === "inactive") {
            return res.status(200).send({ success: true, statusCode: 200, message: 'Verify token send....', verifyToken: existUser.verifyToken });
         }

         token = setToken(existUser);

         if (existUser?.role && existUser?.role === "BUYER") {

            existUser.buyer["defaultShippingAddress"] = (Array.isArray(existUser?.buyer?.shippingAddress) &&
               existUser?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

            existUser.buyer["shoppingCartItems"] = await ShoppingCart.countDocuments({ customerEmail: existUser?.email }) || 0;

            userDataToken = setUserDataToken({
               _UUID: existUser?._UUID,
               fullName: existUser?.fullName,
               email: existUser?.email,
               phone: existUser?.phone,
               phonePrefixCode: existUser?.phonePrefixCode,
               hasPassword: existUser?.hasPassword,
               role: existUser?.role,
               gender: existUser?.gender,
               dob: existUser?.dob,
               idFor: existUser?.idFor,
               accountStatus: existUser?.accountStatus,
               authProvider: existUser?.authProvider,
               contactEmail: existUser?.contactEmail,
               buyer: existUser?.buyer
            });
         }
      }

      if (token) {
         res.cookie("token", token, cookieObject);

         // if all success then return the response
         return res.status(200).send({ name: "isLogin", message: "LoginSuccess", uuid: existUser?._UUID, u_data: userDataToken });
      }
   } catch (error: any) {
      return next(error);
   }
};


/**
 * @apiController --> Sign Out Users Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.signOutController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      res.clearCookie("token");
      res.status(200).send({ success: true, statusCode: 200, message: "Sign out successfully" });
   } catch (error: any) {
      next(error);
   }
};



module.exports.changePasswordController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const authEmail = req.decoded.email;
      let result: any;

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
         throw new apiResponse.Api400Error("ClientError", `Required old password and new password !`);
      }

      const user = await User.findOne({ email: authEmail });

      if (!user && typeof user !== "object") {
         throw new apiResponse.Api404Error("ClientError", `User not found!`);
      }

      const comparedPassword = await comparePassword(oldPassword, user?.password);

      if (!comparedPassword) {
         throw new apiResponse.Api400Error("ClientError", "Password didn't match !");
      }

      let hashedPwd = await bcrypt.hash(newPassword, saltRounds);

      if (hashedPwd) {
         result = await User.findOneAndUpdate(
            { email: authEmail },
            { $set: { password: hashedPwd } },
            { upsert: true }
         );
      }

      if (result) return res.status(200).send({ success: true, statusCode: 200, message: "Password updated successfully." });

   } catch (error: any) {
      next(error);
   }
}