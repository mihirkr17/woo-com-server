import { NextFunction, Request, Response } from "express";
const { findUserByEmail } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const { generateUserDataToken } = require("../../utils/generator");


module.exports = async function FetchAuthUser(req: Request, res: Response, next: NextFunction) {
   try {
      const authEmail = req.decoded.email;

      // const ipAddress = req.socket?.remoteAddress;

      let user: any = await findUserByEmail(authEmail);

      if (!user || typeof user !== "object") throw new apiResponse.Api404Error("User not found !");

      const userDataToken = generateUserDataToken(user);

      if (!userDataToken) throw new apiResponse.Api500Error("Internal issue !");

      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: 'Welcome ' + user?.fullName,
         u_data: userDataToken
      });

   } catch (error: any) {
      next(error);
   }
};