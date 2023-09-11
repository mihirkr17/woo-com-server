const { Api400Error } = require("../errors/apiResponse");
import { NextFunction, Request, Response } from "express";
const { validPassword, validEmail, validString } = require("../utils/validator");


module.exports.loginMDL = async (req: Request, res: Response, next: NextFunction) => {

   const { emailOrPhone, cPwd } = req.body;


   try {
      if (!emailOrPhone)
         throw new Api400Error("Required email or phone number !");

      if (!validString(emailOrPhone)) throw new Api400Error("Invalid string type !");

      if (!cPwd)
         throw new Api400Error("Required password !");

      if (typeof cPwd !== "string")
         throw new Api400Error("Password should be string !");

      if (!validPassword(cPwd))
         throw new Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");

      if (cPwd.length < 5 || cPwd.length > 8)
         throw new Api400Error("Password length should be 5 to 8 characters !");

      next();
   } catch (error) {
      next(error);
   }
}

module.exports.registrationMDL = async (req: Request, res: Response, next: NextFunction) => {

   try {

      const { phone, email, password, gender, fullName } = req?.body;

      if (!phone) {
         throw new Api400Error("Required phone number !");
      }

      else if (!email) {
         throw new Api400Error("Required email address !");
      }

      else if (!gender) {
         throw new Api400Error("Required gender !");
      }

      else if (!fullName) {
         throw new Api400Error("Required full name !");
      }

      else if (!password) {
         throw new Api400Error("Required password !");
      }

      else if (password && typeof password !== "string") {
         throw new Api400Error("Password should be string !");
      }

      else if (password.length < 5 || password.length > 8) {
         throw new Api400Error("Password length should be 5 to 8 characters !");
      }

      else if (!validPassword(password)) {
         throw new Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
      }

      else {
         next();
      }
   } catch (error: any) {
      next(error);
   }
}

module.exports.supplierRegistrationMDL = async (req: Request, res: Response, next: NextFunction) => {
   let body = req.body;
   const requiredGenderValue = ["Male", "Female", "Others"];

   const { email, phone, fullName, password, gender } = body as { email: string, phone: string, fullName: string, password: string, gender: string };

   if (!fullName) throw new Api400Error("Required full name !");

   if (fullName.length < 3 || fullName.length > 18) throw new Api400Error("Full name characters length should be 3 to 18 !");

   if (!email) throw new Api400Error("Required email address !");

   if (!validEmail(email)) throw new Api400Error("Required valid email address !");

   if (!phone) throw new Api400Error("Required phone number !");

   if (!password)
      throw new Api400Error(`Required password !`);

   if (password && typeof password !== "string")
      throw new Api400Error("Password should be string !");

   if (password.length < 5 || password.length > 8)
      throw new Api400Error("Password length should be 5 to 8 characters !");

   if (!validPassword(password))
      throw new Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");

   if (!gender)
      return new Api400Error("Required gender !");

   if (!requiredGenderValue.includes(gender))
      return new Api400Error("Invalid gender format !");


   next();
}