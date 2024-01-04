// src/controllers/products.controller.ts

import { NextFunction, Request, Response } from "express";
const {
  findUserByEmail,
  updateProductPerformance,
} = require("../services/common.service");

const {
  product_detail_pipe,
  product_detail_relate_pipe,
  home_store_product_pipe,
  search_product_pipe,
  ctg_filter_product_pipe,
  ctg_main_product_pipe,
  product_detail_review_pipe,
} = require("../utils/pipelines");
const NodeCache = require("../utils/NodeCache");
const PrivacyPolicy = require("../model/privacyPolicy.model");
const User = require("../model/CUSTOMER_TBL");
const Review = require("../model/REVIEWS_TBL");
const Product = require("../model/PRODUCT_TBL");
const { Error400 } = require("../res/response");
const { store_products_pipe } = require("../utils/pipelines");
const { ObjectId } = require("mongodb");

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function getStore(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { storeTitle } = req?.params;
    const { page, sorted, id } = req.query;
    const filters: any = req.query?.filters;

    const regex = /[<>{}|\\^%]/g;

    if (typeof storeTitle !== "string")
      throw new Error400("Invalid store name !");

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

    Filter["$and"] = [{ supplierId: ObjectId(id) }, { status: "Active" }];

    let sortList: any = {};

    if (sorted === "lowest") {
      sortList = { $sort: { "pricing.sellingPrice": 1 } };
    } else if (sorted === "highest") {
      sortList = { $sort: { "pricing.sellingPrice": -1 } };
    } else if (sorted === "popularity") {
      sortList = { $sort: { score: -1 } };
    } else {
      sortList = { $sort: { _id: -1 } };
    }

    for (const key in filterResult) {
      let item = filterResult[key];

      Filter[key] = {
        $in: item.map((v: any) => {
          return new RegExp("\\b" + v + "\\b", "i");
        }),
      };

      if (key === "rating") {
        Filter[key + "Average"] = { $gte: Math.max(...item.map(parseFloat)) };
        // Filter["$or"] = item.map((v: any) => ({ ratingAverage: { $gte: parseFloat(v) } }))
        delete Filter["rating"];
      }
    }

    const allProducts = await Product.aggregate(
      store_products_pipe(page, Filter, sortList)
    );

    let filteringProductTotal = await Product.aggregate([
      { $match: Filter },
      {
        $group: {
          _id: "$supplierId",
          totalProduct: { $count: {} },
        },
      },
      { $project: { totalProduct: 1 } },
    ]);

    filteringProductTotal = filteringProductTotal[0];

    let storeInfo = await Product.aggregate([
      {
        $match: { $and: [{ status: "Active" }, { supplierId: ObjectId(id) }] },
      },
      {
        $project: {
          variation: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$variations",
                      as: "vars",
                      cond: { $eq: ["$$vars.stock", "in"] },
                    },
                  },
                  0,
                ],
              },
              {},
            ],
          },
          rating: 1,
          categories: 1,
          supplierId: 1,
          brand: 1,
          totalMulti: {
            $reduce: {
              input: "$rating",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  { $multiply: ["$$this.count", "$$this.weight"] },
                ],
              },
            },
          },
          totalCount: {
            $reduce: {
              input: "$rating",
              initialValue: 0,
              in: { $add: ["$$value", "$$this.count"] },
            },
          },
        },
      },
      {
        $lookup: {
          from: "stores",
          localField: "supplierId",
          foreignField: "_id",
          as: "store",
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [{ $arrayElemAt: ["$store", 0] }, "$$ROOT"],
          },
        },
      },
      {
        $group: {
          _id: "$storeTitle",
          totalProduct: { $count: {} },
          categories: { $push: { $last: "$categories" } },
          brands: { $push: "$brand" },
          totalRatingCount: { $sum: "$totalCount" },
          totalRatingMulti: { $sum: "$totalMulti" },
        },
      },

      {
        $project: {
          storeTitle: 1,
          supplier: 1,
          _id: 1,
          totalProduct: 1,
          brands: 1,
          categories: 1,
          totalRatingCount: 1,
          prices: 1,
          averageRating: {
            $round: [
              {
                $cond: [
                  { $eq: ["$totalRatingCount", 0] },
                  0,
                  { $divide: ["$totalRatingMulti", "$totalRatingCount"] },
                ],
              },
              2,
            ],
          },
        },
      },
    ]);

    storeInfo = storeInfo[0];

    return res.status(200).send({
      success: true,
      statusCode: 200,
      data: {
        allProducts,
        storeInfo,
        filteringProductTotal: filteringProductTotal?.totalProduct ?? 0,
      },
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function fetchProductDetails(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { sku, oTracker } = req.query;
    const { productId } = req?.params;

    if (!productId || typeof productId !== "string")
      throw new Error400("Invalid product id ");

    if (!sku || typeof sku !== "string") throw new Error400("Invalid sku");

    let productDetail: any;

    // Product Details
    let cacheData = NodeCache.getCache(`${productId}_${sku}`);

    if (cacheData) {
      productDetail = cacheData;
    } else {
      productDetail = await Product.aggregate(
        product_detail_pipe(productId, sku)
      ).allowDiskUse(true);

      productDetail = productDetail[0];

      if (oTracker === productDetail?.variation?.sku) {
        await updateProductPerformance(
          {
            _id: productId,
            sku: sku,
            views: productDetail?.views || 0,
            ratingAverage: productDetail?.ratingAverage || 0,
            sales: productDetail?.sales || 0,
          },
          "views"
        );
      }

      NodeCache.saveCache(`${productId}_${sku}`, productDetail);
    }

    // all success
    return res.status(200).send({
      success: true,
      statusCode: 200,
      data: {
        product: productDetail || {},
      },
    });
  } catch (error: any) {
    next(error);
  }
}

async function relatedProducts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { category, pid } = req?.query;

    // Related products
    const relatedProducts = await Product.aggregate(
      product_detail_relate_pipe(pid, [category])
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        relatedProducts: relatedProducts || [],
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function productsByCategoryController(
  req: Request,
  res: Response,
  next: any
) {
  try {
    const { price_range, queries: qq } = req.body;

    const { brand, ctg, sorted, filters } = qq;

    const queries: any = [];

    if (brand) {
      queries.push({
        brand: { $regex: new RegExp(brand?.split(",").join("|"), "i") },
      });
    }

    if (ctg) {
      queries.push({ categories: { $all: ctg } });
    }

    let filterOption = {};

    if (queries.length >= 1) {
      filterOption = { $and: queries };
    }

    let sorting = {};

    if (sorted === "lowest") {
      sorting = { $sort: { "pricing.sellingPrice": 1 } };
    } else if (sorted === "highest") {
      sorting = { $sort: { "pricing.sellingPrice": -1 } };
    } else {
      sorting = { $sort: { score: 1 } };
    }

    const filterData =
      (await Product.aggregate(ctg_filter_product_pipe(ctg))) || [];

    const products =
      (await Product.aggregate(ctg_main_product_pipe(filterOption, sorting))) ||
      [];

    return products
      ? res
          .status(200)
          .send({ success: true, statusCode: 200, products, filterData })
      : res.status(404).send({
          success: false,
          statusCode: 404,
          message: "Products not available.",
        });
  } catch (error: any) {
    next(error);
  }
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function searchProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.params.q;

    if (!q || q === "") {
      return res.status(200).send([]);
    }

    const result = (await Product.aggregate(search_product_pipe(q))) || [];

    return result && res.status(200).send(result);
  } catch (error: any) {
    next(error);
  }
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function homeStoreController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const totalLimits = parseInt(req.params.limits);

    const products = await Product.aggregate(
      home_store_product_pipe(totalLimits)
    );

    return res.status(200).send({
      success: true,
      statusCode: 200,
      data: {
        store: products,
        topSellingProducts: null,
        topRatedProducts: null,
      },
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function fetchTopSellingProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sid: any = req.query.sid;

    let filterQuery: any = {
      status: "Active",
    };
    if (sid) {
      filterQuery["supplierId"] = ObjectId(sid);
    }

    const result = await Product.find(filterQuery)
      .sort({ sales: -1 })
      .limit(6)
      .toArray();

    return res.status(200).send(result);
  } catch (error: any) {
    next(error);
  }
}

module.exports = {
  getStore,
  fetchProductDetails,
  relatedProducts,
  searchProducts,
  homeStoreController,
  fetchTopSellingProduct,
  productsByCategoryController,
};
