import { NextFunction, Request, Response } from "express";
const Product = require("../../model/product.model");
const { Api400Error } = require("../../errors/apiResponse");
const { store_products_pipe } = require("../../utils/pipelines");



module.exports.getStore = async (req: Request, res: Response, next: NextFunction) => {

   try {

      const { storeName } = req?.params;
      const { limit } = req.query;

      if (typeof storeName !== "string") throw new Api400Error("Invalid store name !");

      const allProducts = await Product.aggregate(store_products_pipe(storeName, limit));

      let storeInfo = await Product.aggregate([
         {
            $match: {
               $and: [
                  { "supplier.store_name": storeName },
                  { status: "active" }
               ]
            }
         },
         {
            $project: {
               supplier: 1,
               rating: 1,
               categories: 1,
               brand: 1,
               totalMulti: {
                  $reduce: {
                     input: "$rating",
                     initialValue: 0,
                     in: { $add: ["$$value", { $multiply: ["$$this.count", "$$this.weight"] }] }
                  }
               },
               totalCount: {
                  $reduce: {
                     input: "$rating",
                     initialValue: 0,
                     in: { $add: ["$$value", "$$this.count"] }
                  }
               }
            }
         },
         {
            $group: {
               _id: "$supplier.store_name",
               totalProduct: { $count: {} },
               categories: { $push: { $last: "$categories" } },
               brands: { $push: "$brand" },
               totalRatingCount: { $sum: "$totalCount" },
               totalRatingMulti: { $sum: "$totalMulti" }
            }
         },
         {
            $project: {
               storeName: "$_id",
               _id: 0,
               totalProduct: 1,
               brands: 1,
               categories: 1,
               totalRatingCount: 1,
               averageRating: {
                  $round: [
                     { $cond: [{ $eq: ["$totalRatingCount", 0] }, 0, { $divide: ["$totalRatingMulti", "$totalRatingCount"] }] },
                     2
                  ]
               }
            }
         }
      ]);

      storeInfo = storeInfo[0];

      return res.status(200).send({ success: true, statusCode: 200, data: { allProducts, storeInfo } });
   } catch (error: any) {
      next(error);
   }
}