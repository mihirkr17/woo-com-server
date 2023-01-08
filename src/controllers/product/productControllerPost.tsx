
import { Request, Response } from "express";
var { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");

const { productIntroTemplate } = require("../../templates/product.template");
const { productCounterAndSetter } = require("../../model/product.model");

/**
 * Adding Product Title and slug first
 */
module.exports.setProductIntroController = async (
   req: Request,
   res: Response
) => {
   try {
      const db = await dbConnection();
      const authEmail = req.decoded.email;
      const formTypes = req.params.formTypes;
      const body = req.body;
      const productId = req.headers?.authorization || null;
      let model;

      const user = await db
         .collection("users")
         .findOne({ $and: [{ email: authEmail }, { role: 'SELLER' }] });

      if (!user) {
         return res
            .status(401)
            .send({ success: false, statusCode: 401, error: "Unauthorized" });
      }

      if (formTypes === "update" && productId) {
         model = productIntroTemplate(body);
         model['modifiedAt'] = new Date(Date.now());

         let result = await db
            .collection("products")
            .updateOne(
               { $and: [{ _id: ObjectId(productId) }, { save_as: "draft" }] },
               { $set: model },
               { upsert: true }
            );

         return result?.acknowledged
            ? res.status(200).send({
               success: true,
               statusCode: 200,
               message: "Product updated successfully.",
            })
            : res.status(400).send({
               success: false,
               statusCode: 400,
               error: "Operation failed!!!",
            });
      }

      if (formTypes === 'create') {
         model = productIntroTemplate(body);
         model['_lId'] = "LID" + Math.random().toString(36).toUpperCase().slice(2, 18);
         model['sellerData'] = {};
         model.sellerData.sellerId = user?._UUID;
         model.sellerData.sellerName = user?.fullName;
         model.sellerData.storeName = user?.seller?.storeInfos?.storeName;
         model['createdAt'] = new Date(Date.now());

         model["rating"] = [
            { weight: 5, count: 0 },
            { weight: 4, count: 0 },
            { weight: 3, count: 0 },
            { weight: 2, count: 0 },
            { weight: 1, count: 0 },
         ];
         model["ratingAverage"] = 0;
         model['reviews'] = [];

         let result = await db.collection('products').insertOne(model);
         if (result) {
            await productCounterAndSetter(user);

            return res.status(200).send({
               success: true,
               statusCode: 200,
               message: "Data saved.",
            });
         }
      }
   } catch (error: any) {
      res
         .status(500)
         .send({ success: false, statusCode: 500, error: error.message });
   }
};