import { Request, Response } from "express";
const User = require("../../model/user.model");
const { dbConnection } = require("../../utils/db");

/**
 * controller --> fetch authenticate user information
 * request method --> GET
 * required --> NONE
 */
module.exports.fetchAuthUser = async (
   req: Request,
   res: Response,
   next: any
) => {
   try {
      const authEmail = req.decoded.email;
      const role = req.decoded.role;
      let result: any;

      const db = await dbConnection();

      result = await User.findOne({ $and: [{ email: authEmail }, { role: role }, { accountStatus: 'active' }] });

      if (!result || typeof result !== "object") {
         return res.status(404).send({ success: false, statusCode: 404, error: "User not found!" });
      }

      result.password = undefined;
      result.authProvider = undefined;
      result.createdAt = undefined;

      return res.status(200).send({ success: true, statusCode: 200, message: 'Welcome ' + result?.username, data: result });

   } catch (error: any) {
      next(error);
   }
};






module.exports.manageUsers = async (req: Request, res: Response, next: any) => {
   try {
      const db = await dbConnection();

      const uType = req.query.uTyp;
      res
         .status(200)
         .send(await db.collection("users").find({ role: uType }).toArray());
   } catch (error: any) {
      next(error);
   }
};




/**
* controller --> fetch seller request in admin dashboard
* request method --> GET
* required --> NONE
*/
module.exports.checkSellerRequest = async (req: Request, res: Response) => {
   try {
      let sellers = await User.find({ isSeller: 'pending' });

      sellers.forEach((user: any) => {
         delete user?.password;
      });

      return res.status(200).send({ success: true, statusCode: 200, data: sellers });
   } catch (error: any) {
      res.status(500).send({ success: false, statusCode: 500, error: error?.message });
   }
};
