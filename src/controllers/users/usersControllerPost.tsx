import { Request, Response } from "express";
const setToken = require("../../utils/setToken");
const User = require("../../model/user.model");
const { comparePassword } = require("../../utils/comparePassword");
const generateVerifyToken = require("../../utils/generateVerifyToken");


/**
 * controller --> user login controller
 * request method --> POST
 * required --> BODY
 */
module.exports.userLoginController = async (req: Request, res: Response) => {
   try {
      const verify_token = req.headers.authorization?.split(' ')[1] || undefined;
      const { username, password, authProvider } = req.body;
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
            { $or: [{ username }, { email: username }] },
            { authProvider: provider }
         ]
      });

      /// third party login system like --> Google
      if (authProvider === 'thirdParty') {

         if (!existUser || typeof existUser === 'undefined') {
            const user = new User({ email: username, username, authProvider, accountStatus: 'active' });
            userData = await user.save();

         } else {
            userData = existUser;
         }

         token = setToken(userData);
      }

      // system login
      else {

         if (!existUser) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'User not found !!!' });
         }

         let comparedPassword = await comparePassword(password, existUser?.password);

         if (!comparedPassword) {
            return res.status(400).send({ success: false, statusCode: 400, error: "Password didn't match !!!" });
         }

         if (existUser.verifyToken && !verify_token) {
            res.cookie("verifyToken", existUser.verifyToken, { maxAge: 3600000, httpOnly: false });

            return res.send({ success: true, statusCode: 200, message: 'verifyTokenOnCookie' });
         }

         // next condition
         if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {

            if (existUser?.verifyToken !== verify_token) {
               return res.status(400).send({ success: false, statusCode: 400, error: 'Required valid token !!!' });
            }

            await User.updateOne({ $or: [{ username }, { email: username }] }, { $unset: { verifyToken: 1 }, $set: { accountStatus: 'active' } });
            res.clearCookie('verifyToken');
         }

         token = setToken(existUser);
      }

      if (token) {
         res.cookie("token", token, cookieObject);
         res.cookie("is_logged", existUser?._id, { httpOnly: false, maxAge: 57600000 });
         return res.status(200).send({ message: "isLogin", statusCode: 200, success: true });
      }
   } catch (error: any) {
      return res.status(400).send({ success: false, statusCode: 400, error: error.message });
   }
};


/**
 * controller --> user registration controller
 * request method --> POST
 * required --> BODY
 */
module.exports.userRegisterController = async (req: Request, res: Response, next: any) => {
   try {

      let body = req.body;

      let existUser = await User.findOne({ $or: [{ username: body?.username }, { email: body.email }] });

      if (existUser) {
         return res.status(400).send({ success: false, statusCode: 400, error: "User already exists ! Please try another username or email address." });
      }

      body['verifyToken'] = generateVerifyToken();

      let user = new User(body);

      const result = await user.save();

      if (!result) {
         return res.status(500).send({ success: false, statusCode: 500, error: "Internal error!" });
      }

      res.cookie("verifyToken", result?.verifyToken, { maxAge: 3600000, httpOnly: false });

      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: "Registration success. Please verify your account.",
         data: { username: result?.username, verifyToken: result?.verifyToken, email: result?.email }
      });
   } catch (error: any) {
      return res.status(500).send({ success: false, statusCode: 500, error: error.message });
   }
};


/**
 * @controller --> registration verify
 */
module.exports.userRegisterVerify = async (req: Request, res: Response, next: any) => {
   try {
      const verify_token = req.headers.authorization?.split(' ')[1] || undefined;

      const existUser = await User.findOne({ verifyToken: verify_token });


      if (!existUser) {
         return res.status(400).send({ success: false, statusCode: 400, error: 'User not found !!!' });
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

   }
}



module.exports.signOutUser = async (req: Request, res: Response) => {
   try {
      res.clearCookie("token");
      res.clearCookie('is_logged');

      res.status(200).send({ success: true, statusCode: 200, message: "Sign out successfully" });
   } catch (error: any) {
      res.status(500).send({ success: false, statusCode: 500, error: error?.message });
   }
};
