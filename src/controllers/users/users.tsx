import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const User = require("../../model/user.model");
const apiResponse = require("../../errors/apiResponse");
/**
 * @apiController --> Update Profile Data Controller
 * @apiMethod --> PUT
 * @apiRequired --> client email in header 
 */
module.exports.updateProfileDataController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const email: string = req.decoded.email;
      const clientEmail = req.headers.authorization || "";
      const body = req.body;

      if (clientEmail !== email) {
         throw new apiResponse.Api400Error("Invalid email address !");
      }

      if (!body || typeof body === "undefined") {
         throw new apiResponse.Api400Error("Required body with request !");
      }

      const { fullName, dob, gender } = body;

      if (!fullName || typeof fullName !== "string") throw new apiResponse.Api400Error("Required full name !");

      if (!dob || typeof dob !== "string") throw new apiResponse.Api400Error("Required date of birth !");

      if (!gender || typeof gender !== "string") throw new apiResponse.Api400Error("Required gender !");

      interface IProfileData {
         fullName: string;
         dob: string;
         gender: string;
      }

      let profileModel: IProfileData = {
         fullName,
         dob,
         gender,
      }


      const result = await User.findOneAndUpdate({ email: email }, { $set: profileModel }, { upsert: true });

      if (result) {
         return res.status(200).send({ success: true, statusCode: 200, message: "Profile updated." });
      }

   } catch (error: any) {
      next(error);
   }
};


/**
 * @apiController --> Make Admin Controller
 * @apiMethod --> PUT
 * @apiRequired --> userId in params
 */
module.exports.makeAdminController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const userId: string = req.params.userId;

      if (!ObjectId.isValid(userId)) {
         return res
            .status(400)
            .send({ success: false, error: "User ID not valid" });
      }

      const result = await User.updateOne(
         { _id: ObjectId(userId) },
         { $set: { role: "ADMIN" } },
         { new: true }
      );

      return result
         ? res.status(200).send({ success: true, message: "Permission granted" })
         : res.status(500).send({ success: false, error: "Failed" });
   } catch (error: any) {
      next(error);
   }
};

/**
 * @apiController --> Demote admin to user Controller
 * @apiMethod --> PUT
 * @apiRequired --> userId in params
 */
module.exports.demoteToUser = async (
   req: Request,
   res: Response,
   next: any
) => {
   try {

      const userId: string = req.params.userId;

      if (!ObjectId.isValid(userId)) {
         return res.status(400).send({ error: "User Id is not valid" });
      }

      res
         .status(200)
         .send(
            await User.updateOne(
               { _id: ObjectId(userId) },
               { $set: { role: "BUYER" } },
               { new: true }
            )
         );
   } catch (error: any) {
      next(error);
   }
};


module.exports.manageUsersController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const uType = req.query.uTyp;

      res.status(200).send(await User.find({ role: uType }));

   } catch (error: any) {
      next(error);
   }
};




/**
* controller --> fetch seller request in admin dashboard
* request method --> GET
* required --> NONE
*/
module.exports.checkSellerRequestController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      let sellers = await User.find({ isSeller: 'pending' });

      sellers.forEach((user: any) => {
         delete user?.password;
      });

      return res.status(200).send({ success: true, statusCode: 200, data: sellers });
   } catch (error: any) {
      next(error);
   }
};

