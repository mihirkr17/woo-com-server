const apiResponse = require("../errors/apiResponse");
import { NextFunction, Request, Response } from "express";
const { isPasswordValid } = require("../services/common.service");


module.exports.loginMDL = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { emailOrPhone, password } = req.body;

      if (!emailOrPhone)
         throw new apiResponse.Api400Error("Required email or phone number !");

      if (!password)
         throw new apiResponse.Api400Error("Required password !");

      if (typeof password !== "string")
         throw new apiResponse.Api400Error("Password should be string !");

      if (!isPasswordValid(password))
         throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");

      if (password.length < 5 || password.length > 8)
         throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");

      next();

   } catch (error: any) {
      next(error);
   }
}


module.exports.registrationMDL = async (req: Request, res: Response, next: NextFunction) => {

   try {

      const { phone, email, password, gender, fullName, dob } = req?.body;

      if (!phone) {
         throw new apiResponse.Api400Error("Required phone number !");
      }

      else if (!email) {
         throw new apiResponse.Api400Error("Required email address !");
      }

      else if (!gender) {
         throw new apiResponse.Api400Error("Required gender !");
      }

      else if (!fullName) {
         throw new apiResponse.Api400Error("Required full name !");
      }

      else if (!dob) {
         throw new apiResponse.Api400Error("Required date of birth !");
      }

      else if (!password) {
         throw new apiResponse.Api400Error("Required password !");
      }

      else if (password && typeof password !== "string") {
         throw new apiResponse.Api400Error("Password should be string !");
      }

      else if (password.length < 5 || password.length > 8) {
         throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");
      }

      else if (!isPasswordValid(password)) {
         throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
      }

      else {
         next();
      }
   } catch (error: any) {
      next(error);
   }
}