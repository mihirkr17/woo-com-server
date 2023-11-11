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
const dbm = require("mongodb");
const { generateVerificationToken } = require("../utils/generator");
const Product_tbl = require("../model/PRODUCT_TBL");
const ProductVariation_tbl = require("../model/PRODUCT_VARIATION_TBL");
module.exports = class ProductService {
    isProduct(productID, sku) {
        return __awaiter(this, void 0, void 0, function* () {
            const pipeline = [
                { $match: { _id: dbm.ObjectId(productID) } },
                {
                    $lookup: {
                        from: "PRODUCT_VARIATION_TBL",
                        localField: "_id",
                        foreignField: "productId",
                        as: "variations",
                    },
                },
                {
                    $addFields: {
                        variation: {
                            $arrayElemAt: [
                                {
                                    $ifNull: [
                                        {
                                            $filter: {
                                                input: "$variations",
                                                as: "variation",
                                                cond: { $eq: ["$$variation.sku", sku] },
                                            },
                                        },
                                        [],
                                    ],
                                },
                                0,
                            ],
                        },
                    },
                },
                {
                    $match: { "variation.sku": sku },
                },
                {
                    $project: {
                        storeId: 1,
                        storeTitle: 1,
                        brand: 1,
                        sku: "$variation.sku",
                        stockQuantity: "$variation.stockQuantity",
                        stock: "$variation.stock",
                    },
                },
                {
                    $match: {
                        $and: [{ sku }, { stockQuantity: { $gte: 1 } }, { stock: "in" }],
                    },
                },
            ];
            try {
                const product = yield Product_tbl.aggregate(pipeline).exec();
                return product.length === 1 ? product[0] : null;
            }
            catch (error) {
                // Handle the error at a higher level if needed
                throw error;
            }
        });
    }
};
