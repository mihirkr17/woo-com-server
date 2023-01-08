import { Request, Response } from "express";
const emailValidator = require("../helpers/emailValidator");


module.exports = async function userRegisterMiddleware(req: Request, res: Response, next: any) {
   try {
      const { phone, email, password } = req.body;

      if (!req.body) {
         return res.status(400).send({ success: false, statusCode: 400, error: "Information not found !!!" });
      }

      if (phone.length <= 3 && phone.length >= 9) {
         return res.status(400).send({ success: false, statusCode: 400, error: 'Username length must between 4 to 8 characters !!!' });
      }

      if (email.length <= 0) {
         return res.status(400).send({ success: false, statusCode: 400, error: 'Email address required !!!' });
      }

      if (!emailValidator(email)) {
         return res.status(400).send({ success: false, statusCode: 400, error: 'Invalid email address !!!' });
      }

      if (password.length <= 0) {
         return res.status(400).send({ success: false, statusCode: 400, error: 'Password required !!!' });
      }

      if (password.length <= 4) {
         return res.status(400).send({ success: false, statusCode: 400, error: 'Password must be greater than 5 characters !!!' });
      }

      next();

   } catch (error: any) {
      return res.status(500).send({ success: false, statusCode: 500, error: error?.message });
   }
}