"use strict";
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
const Product = require("../../model/product.model");
const { Api400Error } = require("../../errors/apiResponse");
const { store_products_pipe } = require("../../utils/pipelines");
module.exports.getStore = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { storeName } = req === null || req === void 0 ? void 0 : req.params;
        const { page, sorted } = req.query;
        const filters = (_a = req.query) === null || _a === void 0 ? void 0 : _a.filters;
        const regex = /[<>{}|\\^%]/g;
        if (typeof storeName !== "string")
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
        Filter["$and"] = [
            { "supplier.storeName": storeName },
            { status: "Active" },
        ];
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
                })
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
                    _id: "$supplier.storeName",
                    totalProduct: { $count: {} },
                }
            },
            { $project: { totalProduct: 1 } }
        ]);
        filteringProductTotal = filteringProductTotal[0];
        let storeInfo = yield Product.aggregate([
            {
                $match: {
                    $and: [
                        { "supplier.storeName": storeName },
                        { status: "Active" }
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
                filteringProductTotal: (_b = filteringProductTotal === null || filteringProductTotal === void 0 ? void 0 : filteringProductTotal.totalProduct) !== null && _b !== void 0 ? _b : 0
            }
        });
    }
    catch (error) {
        next(error);
    }
});
