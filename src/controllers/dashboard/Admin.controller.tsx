// Admin.controller.tsx

import { NextFunction, Request, Response } from "express";
const QueueProduct = require("../../model/queueProduct.model");
const Product = require("../../model/product.model");

const { ObjectId } = require('mongodb');


// Controllers...
module.exports.getAdminController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const pages: any = req.query.pages;
      const item: any = req.query.items;
      let queueProducts: any;

      let countQueueProducts = await QueueProduct.countDocuments({ isVerified: false, save_as: "queue" });

      if (pages || item) {
         queueProducts = await QueueProduct.find({ isVerified: false }).skip(parseInt(pages) > 0 ? ((pages - 1) * item) : 0).limit(item);
      } else {
         queueProducts = await QueueProduct.find({ isVerified: false });
      }


      return res.status(200).send({ success: true, statusCode: 200, data: { queueProducts, countQueueProducts } });
   } catch (error: any) {
      next(error);
   }
}



module.exports.takeThisProductByAdminController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const listingID: string = req.headers.authorization || "";
      const adminEmail: string = req.decoded.email;
      const role: string = req.decoded.role;

      if (!listingID) {
         throw new Error("Listing ID required !");
      }

      var queueProduct = await QueueProduct.findOne({ _LID: listingID }, { __v: 0 });

      if (!queueProduct) {
         throw new Error("Sorry product not found !");
      }

      queueProduct.isVerified = true;
      queueProduct.save_as = "draft";
      queueProduct["verifyStatus"] = { verifiedBy: role, email: adminEmail, verifiedAt: new Date(Date.now()) };

      let filter = { $and: [{ _id: ObjectId(queueProduct?._id) }, { _LID: queueProduct?._LID }] };

      const result = await Product.updateOne(
         filter,
         { $set: queueProduct },
         { upsert: true }
      );

      if (result?.upsertedCount === 1) {

         await QueueProduct.deleteOne(filter);

         return res.status(200).send({ success: true, statusCode: 200, message: "Product taken." });
      } else {
         return res.status(200).send({ success: false, statusCode: 200, message: "Product not taken !" });
      }

   } catch (error: any) {
      next(error);
   }
}
