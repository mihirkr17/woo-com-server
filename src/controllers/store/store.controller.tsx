import { NextFunction, Request, Response } from "express";
const Product = require("../../model/product.model");
const { Api400Error } = require("../../errors/apiResponse");
const { store_products_pipe } = require("../../utils/pipelines");
const { ObjectId } = require("mongodb");



module.exports.getStore = async (req: Request, res: Response, next: NextFunction) => {

   try {

      const { storeName } = req?.params;
      const { page, sorted, id } = req.query;
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
         { supplierId: ObjectId(id) },
         { status: "Active" },
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
               _id: "$supplierId",
               totalProduct: { $count: {} },
            }
         },
         { $project: { totalProduct: 1 } }
      ]);

      filteringProductTotal = filteringProductTotal[0];

      let storeInfo = await Product.aggregate([
         {
            $match: { $and: [{ status: "Active" }, { supplierId: ObjectId(id) }] }
         },
         {
            $project: {
               variation: {
                  $ifNull: [
                     {
                        $arrayElemAt: [{
                           $filter: {
                              input: "$variations",
                              as: "vars",
                              cond: { $eq: ["$$vars.stock", "in"] }
                           }
                        }, 0]
                     },
                     {}
                  ]
               },
               rating: 1,
               categories: 1,
               supplierId: 1,
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
            $lookup: {
               from: 'suppliers',
               localField: "supplierId",
               foreignField: '_id',
               as: 'supplier'
            }
         },
         { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$supplier", 0] }, "$$ROOT"] } } },
         {
            $group: {
               _id: "$storeName",
               totalProduct: { $count: {} },
               categories: { $push: { $last: "$categories" } },
               brands: { $push: "$brand" },
               totalRatingCount: { $sum: "$totalCount" },
               totalRatingMulti: { $sum: "$totalMulti" }
            }
         },

         {
            $project: {
               storeName: 1,
               supplier: 1,
               _id: 1,
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