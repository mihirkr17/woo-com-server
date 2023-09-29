// Admin.controller.tsx

import { NextFunction, Request, Response } from "express";
const Product = require("../../model/product.model");
const User = require("../../model/user.model");
const Supplier = require("../../model/supplier.model");
const email_service = require("../../services/email.service");
const Order = require("../../model/order.model");
const { Api400Error, Api403Error, Api404Error, Api500Error } = require("../../errors/apiResponse");

const { ObjectId } = require('mongodb');


// Controllers...
module.exports.getAdminController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const pages: any = req.query.pages;
      const item: any = req.query.items;
      let queueProducts: any;

      let countQueueProducts = await Product.countDocuments({ status: "Queue" });

      const suppliers = await Supplier.find();
      const buyers = await User.find();

      let cursor = await Product.find({ isVerified: false, status: "Queue" });

      if (pages || item) {
         queueProducts = await cursor.skip(parseInt(pages) > 0 ? ((pages - 1) * item) : 0).limit(item);
      } else {
         queueProducts = await cursor;
      }


      return res.status(200).send({ success: true, statusCode: 200, queueProducts, countQueueProducts, suppliers, buyers });
   } catch (error: any) {
      next(error);
   }
}



module.exports.takeThisProductByAdminController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { role, email } = req?.decoded;

      const { productId } = req.body;

      if (role !== "ADMIN") throw new Api403Error("Forbidden !");

      if (!productId) {
         throw new Api403Error("Product ID required !");
      }


      const result = await Product.findOneAndUpdate(
         { $and: [{ _id: ObjectId(productId) }, { status: "Queue" }] },
         {
            $set: {
               isVerified: true,
               status: "Active",
               verifiedBy: email,
               verifiedAt: new Date(Date.now())
            }
         },
         { upsert: true }
      );

      if (result?.upsertedCount === 1) {

         return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully launched." });
      } else {
         return res.status(200).send({ success: false, statusCode: 200, message: "Product not taken !" });
      }

   } catch (error: any) {
      next(error);
   }
}



module.exports.verifySellerAccountByAdmin = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { uuid, id, email } = req.body;

      if (!uuid || typeof uuid === "undefined") throw new Api400Error("Required user unique id !");

      if (!id || typeof id === "undefined") throw new Api400Error("Required id !");

      const result = await User.findOneAndUpdate(
         { $and: [{ _id: ObjectId(id) }, { email }, { _uuid: uuid }, { isSeller: "pending" }] },
         {
            $set: {
               accountStatus: "Active",
               isSeller: "fulfilled",
               becomeSellerAt: new Date()
            }
         },
         {
            upsert: true
         }
      );

      if (result) {
         await email_service({
            to: result?.email,
            subject: "Verify email address",
            html: `
               <h5>Thanks for with us !</h5>
               <p style="color: 'green'">We have verified your seller account. Now you can login your seller id.</p>
            `
         })
         return res.status(200).send({ success: true, statusCode: 200, message: "Permission granted." });
      }

      throw new Api500Error("Internal problem !");

   } catch (error: any) {
      next(error);
   }
}


module.exports.deleteSupplierAccount = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { id, email } = req.body;

      if (!id || typeof id === "undefined") throw new Api400Error("Required id !");

      if (!ObjectId.isValid(id)) throw new Api400Error("Invalid supplier id !");

      const result = await Supplier.deleteOne({ $and: [{ _id: ObjectId(id) }, { email }] });

      if (result) {
         return res.status(200).send({ success: true, statusCode: 200, message: "Account deleted successfully." });
      }

      throw new Api500Error("Internal server error !");
   } catch (error: any) {
      next(error);
   }
}





module.exports.getBuyerInfoByAdmin = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { id, email } = req.body;


      const order = await Order.findOne({ user_email: email });

      if (order) {
         let totalOrder = Array.isArray(order?.orders) && order?.orders.length || 0;

         return res.status(200).send({
            success: true, statusCode: 200, data: {
               totalOrder
            }
         })
      }

      throw new Api404Error("Data not found !");
   } catch (error: any) {
      next(error);
   }
}