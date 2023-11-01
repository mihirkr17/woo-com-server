"use strict";
// src/controllers/products.controller.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { findUserByEmail, updateProductPerformance, } = require("../services/common.service");
const { product_detail_pipe, product_detail_relate_pipe, home_store_product_pipe, search_product_pipe, ctg_filter_product_pipe, ctg_main_product_pipe, product_detail_review_pipe, } = require("../utils/pipelines");
const NodeCache = require("../utils/NodeCache");
const PrivacyPolicy = require("../model/privacyPolicy.model");
const User = require("../model/user.model");
const Review = require("../model/reviews.model");
const Product = require("../model/product.model");
const { Api400Error } = require("../errors/apiResponse");
const { store_products_pipe } = require("../utils/pipelines");
const { ObjectId } = require("mongodb");
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function getStore(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { storeTitle } = req === null || req === void 0 ? void 0 : req.params;
            const { page, sorted, id } = req.query;
            const filters = (_a = req.query) === null || _a === void 0 ? void 0 : _a.filters;
            const regex = /[<>{}|\\^%]/g;
            if (typeof storeTitle !== "string")
                throw new Api400Error("Invalid store name !");
            let filterArr = filters ? filters.replace(regex, "").split("--") : [];
            const filterResult = filterArr.reduce((obj, items) => {
                const [key, value] = items === null || items === void 0 ? void 0 : items.split("__");
                if (obj[key]) {
                    obj[key].push(value);
                }
                else {
                    obj[key] = [value];
                }
                return obj;
            }, {});
            let Filter = {};
            Filter["$and"] = [{ storeId: ObjectId(id) }, { status: "Active" }];
            let sortList = {};
            if (sorted === "lowest") {
                sortList = { $sort: { "pricing.sellingPrice": 1 } };
            }
            else if (sorted === "highest") {
                sortList = { $sort: { "pricing.sellingPrice": -1 } };
            }
            else if (sorted === "popularity") {
                sortList = { $sort: { score: -1 } };
            }
            else {
                sortList = { $sort: { _id: -1 } };
            }
            for (const key in filterResult) {
                let item = filterResult[key];
                Filter[key] = {
                    $in: item.map((v) => {
                        return new RegExp("\\b" + v + "\\b", "i");
                    }),
                };
                if (key === "rating") {
                    Filter[key + "Average"] = { $gte: Math.max(...item.map(parseFloat)) };
                    // Filter["$or"] = item.map((v: any) => ({ ratingAverage: { $gte: parseFloat(v) } }))
                    delete Filter["rating"];
                }
            }
            const allProducts = yield Product.aggregate(store_products_pipe(page, Filter, sortList));
            let filteringProductTotal = yield Product.aggregate([
                { $match: Filter },
                {
                    $group: {
                        _id: "$storeId",
                        totalProduct: { $count: {} },
                    },
                },
                { $project: { totalProduct: 1 } },
            ]);
            filteringProductTotal = filteringProductTotal[0];
            let storeInfo = yield Product.aggregate([
                {
                    $match: { $and: [{ status: "Active" }, { storeId: ObjectId(id) }] },
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
                        storeId: 1,
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
                        localField: "storeId",
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
                    filteringProductTotal: (_b = filteringProductTotal === null || filteringProductTotal === void 0 ? void 0 : filteringProductTotal.totalProduct) !== null && _b !== void 0 ? _b : 0,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function fetchProductDetails(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { pId: productID, sku, oTracker } = req.query;
            if (!productID || typeof productID !== "string")
                throw new Api400Error("Invalid product id ");
            if (!sku || typeof sku !== "string")
                throw new Api400Error("Invalid sku");
            let productDetail;
            // Product Details
            let cacheData = NodeCache.getCache(`${productID}_${sku}`);
            if (cacheData) {
                productDetail = cacheData;
            }
            else {
                productDetail = yield Product.aggregate(product_detail_pipe(productID, sku)).allowDiskUse(true);
                productDetail = productDetail[0];
                if (oTracker) {
                    yield updateProductPerformance({
                        _id: productID,
                        sku: sku,
                        views: (productDetail === null || productDetail === void 0 ? void 0 : productDetail.views) || 0,
                        ratingAverage: (productDetail === null || productDetail === void 0 ? void 0 : productDetail.ratingAverage) || 0,
                        sales: (productDetail === null || productDetail === void 0 ? void 0 : productDetail.sales) || 0,
                    }, "views");
                }
                // productDetail["policies"] = await PrivacyPolicy.findOne({}) ?? {};
                NodeCache.saveCache(`${productID}_${sku}`, productDetail);
            }
            // Related products
            const relatedProducts = yield Product.aggregate(product_detail_relate_pipe(sku, productDetail === null || productDetail === void 0 ? void 0 : productDetail.categories));
            // all success
            return res.status(200).send({
                success: true,
                statusCode: 200,
                data: {
                    product: productDetail || {},
                    relatedProducts: relatedProducts || [],
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function productsByCategoryController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { price_range, queries: qq } = req.body;
            const { brand, ctg, sorted, filters } = qq;
            const queries = [];
            if (brand) {
                queries.push({
                    brand: { $regex: new RegExp(brand === null || brand === void 0 ? void 0 : brand.split(",").join("|"), "i") },
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
            }
            else if (sorted === "highest") {
                sorting = { $sort: { "pricing.sellingPrice": -1 } };
            }
            else {
                sorting = { $sort: { score: 1 } };
            }
            const filterData = (yield Product.aggregate(ctg_filter_product_pipe(ctg))) || [];
            const products = (yield Product.aggregate(ctg_main_product_pipe(filterOption, sorting))) ||
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
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function searchProducts(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const q = req.params.q;
            if (!q || q === "") {
                return res.status(200).send([]);
            }
            const result = (yield Product.aggregate(search_product_pipe(q))) || [];
            return result && res.status(200).send(result);
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function homeStoreController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const totalLimits = parseInt(req.params.limits);
            const products = yield Product.aggregate(home_store_product_pipe(totalLimits));
            return res.status(200).send({
                success: true,
                statusCode: 200,
                data: {
                    store: products,
                    topSellingProducts: null,
                    topRatedProducts: null,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function fetchTopSellingProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sid = req.query.sid;
            let filterQuery = {
                status: "Active",
            };
            if (sid) {
                filterQuery["storeId"] = ObjectId(sid);
            }
            const result = yield Product.find(filterQuery)
                .sort({ sales: -1 })
                .limit(6)
                .toArray();
            return res.status(200).send(result);
        }
        catch (error) {
            next(error);
        }
    });
}
module.exports = {
    getStore,
    fetchProductDetails,
    searchProducts,
    homeStoreController,
    fetchTopSellingProduct,
    productsByCategoryController,
};
