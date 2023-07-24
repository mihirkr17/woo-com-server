import { NextFunction, Request, Response } from "express";
const Product = require("../../model/product.model");
const { Api400Error } = require("../../errors/apiResponse");
const { store_products_pipe } = require("../../utils/pipelines");



module.exports.getStore = async (req: Request, res: Response, next: NextFunction) => {

   try {

      const { storeName } = req?.params;
      const { page, sorted } = req.query;
      const filters: any = req.query?.filters;

      const regex = /[<>{}|\\^%]/g;

      if (typeof storeName !== "string") throw new Api400Error("Invalid store name !");

      let filterArr = filters ? filters.replace(regex, "").split("--") : [];

      const filterResult = filterArr.reduce((obj: any, items: any) => {
         const [key, value] = items?.split("__");

         if (obj[key]) {
            obj[key].push(value);
         } else {
            obj[key] = [value];
         }

         return obj;
      }, {});

      let Filter: any = {};

      Filter["$and"] = [
         { "supplier.storeName": storeName },
         { status: "active" },
      ];

      let sortList: any = {};

      if (sorted === "lowest") {
         sortList = { $sort: { "pricing.sellingPrice": 1 } };
      } else if (sorted === "highest") {
         sortList = { $sort: { "pricing.sellingPrice": -1 } }
      } else if (sorted === "popularity") {
         sortList = { $sort: { score: -1 } };
      } else {
         sortList = { $sort: { _id: -1 } }
      }



      for (const key in filterResult) {
         let item = filterResult[key];

         Filter[key] = {
            $in: item.map((v: any) => {
               return new RegExp("\\b" + v + "\\b", "i");
            })
         }

         if (key === "rating") {
            Filter[key + "Average"] = { $gte: Math.max(...item.map(parseFloat)) }
            // Filter["$or"] = item.map((v: any) => ({ ratingAverage: { $gte: parseFloat(v) } }))
            delete Filter["rating"];
         }
      }

      const allProducts = await Product.aggregate(store_products_pipe(page, Filter, sortList));

      let filteringProductTotal = await Product.aggregate([
         { $match: Filter },
         {
            $group: {
               _id: "$supplier.storeName",
               totalProduct: { $count: {} },
            }
         },
         { $project: { totalProduct: 1 } }
      ]);

      filteringProductTotal = filteringProductTotal[0];

      let storeInfo = await Product.aggregate([
         {
            $match: {
               $and: [
                  { "supplier.storeName": storeName },
                  { status: "active" }
               ]
            }
         },

         {
            $project: {
               supplier: 1,
               pricing: 1,
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
               _id: "$supplier.email",
               totalProduct: { $count: {} },
               categories: { $push: { $last: "$categories" } },
               brands: { $push: "$brand" },
               totalRatingCount: { $sum: "$totalCount" },
               totalRatingMulti: { $sum: "$totalMulti" }
            }
         },
         {
            $lookup: {
               from: 'users',
               localField: "_id",
               foreignField: '_uuid',
               as: 'user'
            }
         },
         { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$user", 0] }, "$$ROOT"] } } },
         {
            $project: {
               store: 1,
               _id: 0,
               totalProduct: 1,
               brands: 1,
               categories: 1,
               totalRatingCount: 1,
               prices: 1,
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

      return res.status(200).send({
         success: true, statusCode: 200, data: {
            allProducts, storeInfo,
            filteringProductTotal: filteringProductTotal?.totalProduct ?? 0
         }
      });
   } catch (error: any) {
      next(error);
   }
}