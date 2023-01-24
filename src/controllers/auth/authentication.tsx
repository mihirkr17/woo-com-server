// authentication.tsx

import { Request, Response } from "express";
const User = require("../../model/user.model");
const generateVerifyToken = require("../../utils/generateVerifyToken");
const apiResponse = require("../../errors/apiResponse");
const setToken = require("../../utils/setToken");
const comparePassword = require("../../utils/comparePassword");

/**
 * @apiController --> Buyer Registration Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.buyerRegistrationController = async (req: Request, res: Response, next: any) => {
   try {

      let body = req.body;

      let existUser = await User.findOne({ $or: [{ phone: body?.phone }, { email: body.email }] });

      if (existUser) {
         throw new apiResponse.Api400Error("RegistrationError", "User already exists, Please try another phone number or email address !");
      }

      body['_UUID'] = Math.random().toString(36).toUpperCase().slice(2, 18);

      body['verifyToken'] = generateVerifyToken();

      body['idFor'] = 'buy';

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
         data: { phone: result?.phone, verifyToken: result?.verifyToken, email: result?.email }
      });
   } catch (error: any) {
      return next(error);
   }
};



/**
 * @apiController --> Seller Registration Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.sellerRegistrationController = async (req: Request, res: Response, next: any) => {
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
 * @controller --> registration verify
 */
module.exports.userVerifyTokenController = async (req: Request, res: Response, next: any) => {
   try {
      const verify_token = req.headers.authorization?.split(' ')[1] || undefined;

      const existUser = await User.findOne({ verifyToken: verify_token });

      if (!existUser) {
         throw new apiResponse.Api400Error("VerifyTokenError", "Sorry, User not found !");
      }

      if (existUser.verifyToken && !verify_token) {
         res.cookie("verifyToken", existUser.verifyToken, { maxAge: 3600000, httpOnly: false });
         return res.send({ success: true, statusCode: 200, message: 'verifyTokenOnCookie' });
      }

      // next condition
      if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {

         if (existUser?.verifyToken !== verify_token) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'Invalid token !!!' });
         }

         await User.updateOne(
            { verifyToken: verify_token },
            {
               $unset: { verifyToken: 1 },
               $set: { accountStatus: 'active' }
            }
         );

         res.clearCookie('verifyToken');

         return res.status(200).send({ success: true, statusCode: 200, message: "User verified.", data: { username: existUser?.username } });
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
module.exports.loginController = async (req: Request, res: Response, next: any) => {
   try {
      const verify_token = req.headers.authorization?.split(' ')[1] || undefined;
      const { emailOrPhone, password, authProvider } = req.body;
      let token: String;
      let userData;
      let provider: String;

      const cookieObject: any = {
         // sameSite: "none",
         // secure: true,
         maxAge: 57600000, // 16hr [3600000 -> 1hr]ms
         httpOnly: true,
      };

      if (typeof authProvider === 'undefined' || !authProvider) {
         provider = 'system';
      } else {
         provider = authProvider;
      }

      const existUser = await User.findOne({
         $and: [
            { $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
            { authProvider: provider },
            { accountStatus: 'active' }
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

         if (existUser.verifyToken && !verify_token) {
            res.cookie("verifyToken", existUser.verifyToken, { maxAge: 3600000, httpOnly: false });

            return res.send({ success: true, statusCode: 200, message: 'verifyTokenOnCookie' });
         }

         // next condition
         if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {

            if (existUser?.verifyToken !== verify_token) {
               throw new apiResponse.Api400Error("TokenError", 'Required valid token !');
            }

            await User.updateOne({ email: emailOrPhone }, { $unset: { verifyToken: 1 }, $set: { accountStatus: 'active' } });
            res.clearCookie('verifyToken');
         }

         token = setToken(existUser);
      }

      if (token) {
         res.cookie("token", token, cookieObject);
         res.cookie("is_logged", existUser?._id, { httpOnly: false, maxAge: 57600000 });

         return res.status(200).send({ name: "isLogin", message: "LoginSuccess" });
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
module.exports.signOutController = async (req: Request, res: Response, next: any) => {
   try {
      res.clearCookie("token");
      res.clearCookie('is_logged');

      res.status(200).send({ success: true, statusCode: 200, message: "Sign out successfully" });
   } catch (error: any) {
      next(error);
   }
};