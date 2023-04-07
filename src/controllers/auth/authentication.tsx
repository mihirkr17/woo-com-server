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
const email_service = require("../../services/email.service");
const { get_six_digit_random_number, isPasswordValid } = require("../../services/common.service");
const { verify_email_html_template } = require("../../templates/email.template");

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


      const info = await email_service({
         to: body?.email,
         subject: "Verify email address",
         html: verify_email_html_template(body?.verifyToken, body?._uuid)
      });

      if (info?.response) {
         let user = new User(body);
         await user.save();
         return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Thanks for your information. Verification email was sent to " + body?.email + ". Please verify your account.",
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

      let existUser = await User.findOne({ $or: [{ email: body?.email }, { phone: body?.phone }] });

      if (existUser) {
         throw new apiResponse.Api400Error("User already exists, Please try another phone number or email address !")
      }

      if (!isPasswordValid) throw new apiResponse.Api400Error("Need a strong password !");

      body['_uuid'] = Math.random().toString(36).toUpperCase().slice(2, 18);
      body['authProvider'] = 'system';
      body['isSeller'] = 'pending';
      body['idFor'] = 'sell';
      body["role"] = "SELLER";
      body["accountStatus"] = "inactive";
      body["seller"] = body?.seller || {};

      const info = await email_service({
         to: body?.email,
         subject: "Verify email address",
         html: verify_email_html_template(body?.verifyToken, body?._uuid)
      });


      if (info?.response) {
         let user = new User(body);
         await user.save();
         return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Thanks for your information. Verification email was sent to " + body?.email + ". Please verify your account.",
         });
      }

      throw new apiResponse.Api500Error("Sorry registration failed !");

   } catch (error: any) {
      next(error);
   }
};


/**
 * @controller --> registration verify by token
 */
module.exports.userEmailVerifyTokenController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { token, mailer } = req.query;

      if (!token) throw new apiResponse.Api400Error("Required token in query !");

      const user = await User.findOne({ $and: [{ verifyToken: token }, { _uuid: mailer }] });

      if (!user) {
         throw new apiResponse.Api400Error("Session is expired !");
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

      const { emailOrPhone, password } = req.body;

      let userDataToken: any;

      let user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });

      if (!user) throw new apiResponse.Api400Error(`User with ${emailOrPhone} not found!`);

      if (user?.isSeller === "pending" && user?.role === "SELLER") throw new apiResponse.Api400Error("Your seller account under processing...");

      if (user?.verifyToken && user?.accountStatus === "inactive") {

         user.verifyToken = generateVerifyToken();

         let newToken = await user.save();

         const info = await email_service({
            to: user?.email,
            subject: "Verify email address",
            html: verify_email_html_template(newToken?.verifyToken, user?._uuid)
         });

         if (info?.response) {
            return res.status(200).send({
               success: true,
               statusCode: 200,
               message: "Email was sent to " + user?.email + ". Please verify your account.",
            });
         }

         throw new apiResponse.Api500Error("Internal error !");
      }

      let comparedPassword = await comparePassword(password, user?.password);

      if (!comparedPassword) throw new apiResponse.Api400Error("Password didn't match !");

      let token = setToken(user);

      if (user?.role && user?.role === "ADMIN") {
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
            accountStatus: user?.accountStatus,
            contactEmail: user?.contactEmail,
            authProvider: user?.authProvider
         });
      }

      if (user?.role && user?.role === "SELLER") {
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

      if (user?.role && user?.role === "BUYER") {

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

      if (token) {
         // if token then set it to client cookie
         res.cookie("token", token, {
            sameSite: "none",
            secure: true,
            maxAge: 57600000,  // 16hr [3600000 -> 1hr]ms
            httpOnly: true
         });

         // if all operation success then return the response
         return res.status(200).send({ name: "isLogin", message: "LoginSuccess", uuid: user?._uuid, u_data: userDataToken });
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


/**
 * @apiController --> Password change controller
 * @apiMethod --> POST
 * @apiRequired --> body {old-password, new-password}
 */
module.exports.changePasswordController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const authEmail = req.decoded.email;

      let result: any;

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword)
         throw new apiResponse.Api400Error(`Required old password and new password !`);

      if (newPassword && typeof newPassword !== "string")
         throw new apiResponse.Api400Error("Password should be string !");

      if (newPassword.length < 5 || newPassword.length > 8)
         throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");

      if (!isPasswordValid(newPassword))
         throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");

      // find user in user db
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

      const info = await email_service({
         to: email, // the user email
         subject: 'Reset your WooKart Password',
         html: `<p>Your Security Code is <b>${securityCode}</b> and expire in 5 minutes.</p>`
      })

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