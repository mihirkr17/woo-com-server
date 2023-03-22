// src/controllers/auth/authentication.tsx

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
const { transporter } = require("../../services/email.service");
const { get_six_digit_random_number } = require("../../services/common.services");

/**
 * @apiController --> Buyer Registration Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.buyerRegistrationController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      let body = req.body;

      let existUser = await User.findOne({ $or: [{ phone: body?.phone }, { email: body.email }] });

      if (existUser)
         throw new apiResponse.Api400Error("User already exists, Please try another phone number or email address !");

      body['_uuid'] = Math.random().toString(36).toUpperCase().slice(2, 18);
      body['verifyToken'] = generateVerifyToken();
      body["buyer"] = {};
      body["password"] = await bcrypt.hash(body?.password, saltRounds);
      body["accountStatus"] = "inactive";
      body["hasPassword"] = true;
      body["contactEmail"] = body?.email;
      body["idFor"] = "buy";
      body["role"] = "BUYER";
      body["authProvider"] = "system";

      const info = await transporter.sendMail({
         from: process.env.GMAIL_USER,
         to: body?.email,
         subject: "Verify email address",
         html: `<p>Verify your email address. please click the link below </p> 
         </br> 
         <a href="${process.env.BACKEND_URL}api/v1/auth/verify-register-user?token=${body?.verifyToken}">
            <b>Click Here To Verify</b>
         </a>`
      });


      if (info?.response) {

         let user = new User(body);
         await user.save();
         return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Email was sent to " + body?.email + ". Please verify your account.",
         });
      }

      throw new apiResponse.Api500Error("Sorry registration failed !");

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
         throw new apiResponse.Api400Error("User already exists, Please try another phone number or email address !")
      }

      body['_uuid'] = Math.random().toString(36).toUpperCase().slice(2, 18);
      body['authProvider'] = 'system';
      body['isSeller'] = 'pending';
      body['idFor'] = 'sell';
      body["seller"] = {};

      let user = new User(body);

      const result = await user.save();

      if (!result) {
         throw new apiResponse.Api500Error("Something went wrong !");
      }

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

      const { token } = req.query;

      if (!token) throw new apiResponse.Api400Error("Required token in query !");

      const user = await User.findOne({ verifyToken: token });

      if (!user) {
         throw new apiResponse.Api404Error("Sorry, User not found !");
      }

      if (user?.verifyToken !== token)
         throw new apiResponse.Api400Error("Invalid verify token !");

      user.accountStatus = "active";

      user.verifyToken = undefined;

      await user.save();

      return res.redirect(`${process.env.FRONTEND_URL}login?email=${user?.email}`);

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
         maxAge: 57600000,  // 16hr [3600000 -> 1hr]ms
         httpOnly: true
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

            const user = new User({ _uuid: UUID, email: emailOrPhone, authProvider, accountStatus: 'active' });
            userData = await user.save();

         } else {
            userData = existUser;
         }

         token = setToken(userData);
      }

      // system login
      else {

         if (!existUser) throw new apiResponse.Api400Error(`User with ${emailOrPhone} not found!`);

         let comparedPassword = await comparePassword(password, existUser?.password);

         if (!comparedPassword) throw new apiResponse.Api400Error("Password didn't match !");

         if (existUser.verifyToken && existUser?.accountStatus === "inactive") {
            const info = await transporter.sendMail({
               from: process.env.GMAIL_USER,
               to: existUser?.email,
               subject: "Verify email address",
               html: `<p>Please verify your email address. please click link below </p> 
               </br> 
               <a href="${process.env.BACKEND_URL}api/v1/auth/verify-register-user?token=${existUser?.verifyToken}">
                  <b>Click Here To Verify</b>
               </a>`
            });

            if (info?.response) {
               return res.status(200).send({
                  success: true,
                  statusCode: 200,
                  message: "Email was sent to " + existUser?.email + ". Please verify your account.",
               });
            }

            return;
         }

         token = setToken(existUser);

         if (existUser?.role && existUser?.role === "BUYER") {

            existUser.buyer["defaultShippingAddress"] = (Array.isArray(existUser?.buyer?.shippingAddress) &&
               existUser?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]) || {};

            existUser.buyer["shoppingCartItems"] = await ShoppingCart.countDocuments({ customerEmail: existUser?.email }) || 0;

            userDataToken = setUserDataToken({
               _uuid: existUser?._uuid,
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
               contactEmail: existUser?.contactEmail,
               buyer: existUser?.buyer,
               authProvider: existUser?.authProvider
            });
         }
      }

      if (token) {
         // if token then set it to client cookie
         res.cookie("token", token, cookieObject);

         // if all operation success then return the response
         return res.status(200).send({ name: "isLogin", message: "LoginSuccess", uuid: existUser?._uuid, u_data: userDataToken });
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
      const { token } = req.cookies; // finding token in http only cookies.

      if (token && typeof token !== "undefined") {
         res.clearCookie("token");
         return res.status(200).send({ success: true, statusCode: 200, message: "Sign out successfully" });
      }

      throw new apiResponse.Api400Error("You already logged out !");
   } catch (error: any) {
      next(error);
   }
};



module.exports.changePasswordController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const authEmail = req.decoded.email;

      let result: any;

      const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{5,}$/;

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword)
         throw new apiResponse.Api400Error(`Required old password and new password !`);

      if (newPassword && typeof newPassword !== "string")
         throw new apiResponse.Api400Error("Password should be string !");

      if (newPassword.length < 5 || newPassword.length > 8)
         throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");

      if (!passwordRegex.test(newPassword))
         throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");

      const user = await User.findOne({ email: authEmail });

      if (!user && typeof user !== "object")
         throw new apiResponse.Api404Error(`User not found!`);

      const comparedPassword = await comparePassword(oldPassword, user?.password);

      if (!comparedPassword) {
         throw new apiResponse.Api400Error("Password didn't match !");
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


module.exports.checkUserAuthentication = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const body = req.body;

      if (!body || typeof body === "undefined") throw new apiResponse.Api400Error("Required body !");

      const { email } = body;

      const user = await User.findOne({ email });

      if (!user || typeof user === "undefined") throw new apiResponse.Api404Error("Sorry user not found with this " + email);

      let securityCode = get_six_digit_random_number();
      let lifeTime = 300000;

      const mailOptions = {
         from: process.env.GMAIL_USER,
         to: email, // the user email
         subject: 'Reset your WooKart Password',
         html: `<p>Your Security Code is <b>${securityCode}</b> and expire in 5 minutes.</p>`
      }

      const info = await transporter.sendMail(mailOptions);

      if (info?.response) {
         res.cookie("securityCode", securityCode, { httpOnly: true, sameSite: "none", secure: true, maxAge: lifeTime });

         return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "We have to send security code to your email..",
            lifeTime,
            email
         });
      } else {
         throw new apiResponse.Api500Error("Sorry ! Something wrong in your email. please provide valid email address.");
      }

   } catch (error: any) {
      next(error);
   }
}


module.exports.checkUserForgotPwdSecurityKey = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const sCode = req.cookies.securityCode;

      if (!sCode) throw new apiResponse.Api400Error("Security code is expired !");

      if (!req.body || typeof req.body === "undefined") throw new apiResponse.Api400Error("Required body !");

      const { email, securityCode } = req.body;

      if (!email) throw new apiResponse.Api400Error("Required email !");

      if (!securityCode)
         throw new apiResponse.Api400Error("Required security code !");

      const user = await User.findOne({ email });

      if (!user || typeof user === "undefined")
         throw new apiResponse.Api404Error("Sorry user not found with this " + email);

      if (securityCode !== sCode)
         throw new apiResponse.Api400Error("Invalid security code !");


      res.clearCookie("securityCode");
      let life = 120000;
      res.cookie("set_new_pwd_session", securityCode, { httpOnly: true, sameSite: "none", secure: true, maxAge: life });

      return res.status(200).send({ success: true, statusCode: 200, message: "Success. Please set a new password.", data: { email: user?.email, securityCode, sessionLifeTime: life } });

   } catch (error: any) {
      next(error);
   }
}

module.exports.userSetNewPassword = async (req: Request, res: Response, next: NextFunction) => {
   try {
      let set_new_pwd_session = req.cookies.set_new_pwd_session;

      if (!set_new_pwd_session) throw new apiResponse.Api400Error("Sorry ! your session is expired !");

      const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{5,}$/;

      const { email, password, securityCode } = req.body;

      if (securityCode !== set_new_pwd_session) throw new apiResponse.Api400Error("Invalid security code !");

      if (!email) throw new apiResponse.Api400Error("Required email address !");

      if (!password)
         throw new apiResponse.Api400Error(`Required password !`);

      if (password && typeof password !== "string")
         throw new apiResponse.Api400Error("Password should be string !");

      if (password.length < 5 || password.length > 8)
         throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");

      if (!passwordRegex.test(password))
         throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");

      const user = await User.findOne({ email });

      if (!user && typeof user !== "object") {
         throw new apiResponse.Api404Error(`User not found!`);
      }

      let hashedPwd = await bcrypt.hash(password, saltRounds);

      let result = hashedPwd ? await User.findOneAndUpdate(
         { email },
         { $set: { password: hashedPwd } },
         { upsert: true }
      ) : false;

      res.clearCookie('set_new_pwd_session');

      if (!result) throw new apiResponse.Api500Error("Something wrong in server !");

      return result && res.status(200).send({ success: true, statusCode: 200, message: "Password updated successfully." });

   } catch (error: any) {
      next(error);
   }
}