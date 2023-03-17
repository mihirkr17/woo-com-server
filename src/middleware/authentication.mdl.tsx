const response = require("../errors/apiResponse");
import { NextFunction, Request, Response } from "express";


module.exports.loginMDL = async (req: Request, res: Response, next: NextFunction) => {

   const { emailOrPhone, password, authProvider } = req.body;
   const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{5,}$/;

   if (authProvider === "thirdParty") {
      next();
      return;
   }

   if (!emailOrPhone) {
      throw new response.Api400Error("ClientError", "Required email or phone number !");
   }

   else if (!password) {
      throw new response.Api400Error("ClientError", "Required password !");
   }

   else if (typeof password !== "string") {
      throw new response.Api400Error("ClientError", "Password should be string !");
   }

   else if (password.length < 5 || password.length > 8) {
      throw new response.Api400Error("ClientError", "Password length should be 5 to 8 characters !");
   }

   else if (!passwordRegex.test(password)) {
      throw new response.Api400Error("ClientError", "Password should contains at least 1 digit, lowercase letter, special character !");
   }

   else {
      next();
   }
}


module.exports.registrationMDL = async (req: Request, res: Response, next: NextFunction) => {

   let body = req.body;
   const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{5,}$/;
   const { phone, email, password, gender, fullName, dob } = body;

   if (!phone) {
      throw new response.Api400Error("ClientError", "Required phone number !");
   }

   else if (!email) {
      throw new response.Api400Error("ClientError", "Required email address !");
   }

   else if (!gender) {
      throw new response.Api400Error("ClientError", "Required gender !");
   }

   else if (!fullName) {
      throw new response.Api400Error("ClientError", "Required full name !");
   }

   else if (!dob) {
      throw new response.Api400Error("ClientError", "Required date of birth !");
   }

   else if (!password) {
      throw new response.Api400Error("ClientError", "Required password !");
   }

   else if (password && typeof password !== "string") {
      throw new response.Api400Error("ClientError", "Password should be string !");
   }

   else if (password.length < 5 || password.length > 8) {
      throw new response.Api400Error("ClientError", "Password length should be 5 to 8 characters !");
   }

   else if (!passwordRegex.test(password)) {
      throw new response.Api400Error("ClientError", "Password should contains at least 1 digit, lowercase letter, special character !");
   }

   else {
      next();
   }
}