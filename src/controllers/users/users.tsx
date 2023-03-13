import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const User = require("../../model/user.model");
const response = require("../../errors/apiResponse");
/**
 * @apiController --> Update Profile Data Controller
 * @apiMethod --> PUT
 * @apiRequired --> client email in header 
 */
module.exports.updateProfileDataController = async (req: Request, res: Response, next: any) => {
   try {
      const email: string = req.decoded.email;
      const clientEmail = req.headers.authorization || "";

      if (clientEmail !== email) {
         throw new response.Api400Error("AuthError", "Invalid email address !");
      }

      const result = await User.updateOne({ email: email }, { $set: req.body }, { new: true });

      if (result?.matchedCount === 1) {
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
module.exports.makeAdminController = async (req: Request, res: Response, next: any) => {
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


module.exports.makeSellerRequest = async (req: Request, res: Response, next: any) => {
   try {
      const authEmail = req.decoded.email;
      const authRole = req.decoded.role;

      let user = await User.findOne({ $and: [{ email: authEmail }, { role: 'BUYER' }] });

      if (!user) {
         return res.status(404).send({ success: false, statusCode: 404, error: 'User not found' });
      }

      if (user?.isSeller === 'pending') {
         return res.status(200).send({
            success: false,
            statusCode: 200,
            error: 'You already send a seller request. We are working for your request, and it will take sometime to verify'
         });
      }

      let body = req.body;

      let businessInfo = {
         taxID: body?.taxID,
         stateTaxID: body?.stateTaxID,
         creditCard: body?.creditCard,
      }

      let sellerInfo = {
         fName: body?.fName,
         lName: body?.lName,
         dateOfBirth: body?.dateOfBirth,
         phone: body?.phone,
         address: {
            street: body?.street,
            thana: body?.thana,
            district: body?.district,
            state: body?.state,
            country: body?.country,
            pinCode: body?.pinCode
         }
      }

      let inventoryInfo = {
         earn: 0,
         totalSell: 0,
         totalProducts: 0,
         storeName: body?.storeName,
         storeCategory: body?.categories,
         storeAddress: {
            street: body?.street,
            thana: body?.thana,
            district: body?.district,
            state: body?.state,
            country: body?.country,
            pinCode: body?.pinCode
         }
      }

      let isUpdate = await User.updateOne(
         { $and: [{ email: authEmail }, { role: authRole }] },
         { $set: { businessInfo, sellerInfo, inventoryInfo, isSeller: 'pending' } },
         { new: true }
      );

      if (isUpdate) {
         return res
            .status(200)
            .send({ success: true, statusCode: 200, message: "Thanks for sending a seller request. We are working for your request" });
      }

   } catch (error: any) {
      next(error);
   }
};



// Permit the seller request
module.exports.permitSellerRequest = async (req: Request, res: Response, next: any) => {
   try {
      const userId = req.headers.authorization?.split(',')[0];
      const UUID = req.headers.authorization?.split(',')[1];
      const userEmail = req.headers.authorization?.split(',')[2];

      const user = await User.findOne({ $and: [{ email: userEmail }, { _id: userId }, { _UUID: UUID }, { isSeller: 'pending' }] });

      // console.log(user);

      if (!user) {
         return res.status(400).send({ success: false, statusCode: 400, error: 'Sorry! request user not found.' });
      }

      let result = await User.updateOne(
         {
            $and: [{ email: userEmail }, { _UUID: UUID }, { isSeller: 'pending' }]
         }
         ,
         {
            $set: { isSeller: 'fulfilled', accountStatus: 'active', becomeSellerAt: new Date() }
         },
         { new: true }
      );

      result?.acknowledged
         ? res.status(200).send({ success: true, statusCode: 200, message: "Request Success" })
         : res.status(400).send({ success: false, statusCode: 400, error: "Bad Request" });

   } catch (error: any) {
      next(error);
   }
};


module.exports.manageUsersController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const uType = req.query.uTyp;

      res.status(200).send(await User.find({ role: uType }).toArray());

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

