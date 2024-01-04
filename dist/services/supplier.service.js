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
const ProductTbl = require("../model/PRODUCT_TBL");
const VariationTbl = require("../model/PRODUCT_VARIATION_TBL");
const OrderTbl = require("../model/ORDER_TBL");
const StoreTbl = require("../model/SUPPLIER_TBL");
const { ObjectId: mdbObjectId } = require("mongodb");
/**
 *
 * @param supplierId
 * @param productId
 * @param variation
 * @returns
 */
function updateStockService(supplierId, productId, variation) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.findOneAndUpdate({
                $and: [
                    { _id: mdbObjectId(productId) },
                    { supplierId: mdbObjectId(supplierId) },
                ],
            }, {
                $set: {
                    "variations.$[i].available": variation === null || variation === void 0 ? void 0 : variation.available,
                    "variations.$[i].stock": variation === null || variation === void 0 ? void 0 : variation.stock,
                },
            }, {
                arrayFilters: [{ "i.sku": variation === null || variation === void 0 ? void 0 : variation.sku }],
            });
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param supplierId
 * @param productId
 * @param values
 * @returns
 */
function updateMainProductService(supplierId, productId, values) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.findOneAndUpdate({
                $and: [
                    { supplierId: mdbObjectId(supplierId) },
                    { _id: mdbObjectId(productId) },
                ],
            }, values, { upsert: true });
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param supplierId
 * @param productId
 * @returns
 */
function findProductVariationByIdAndSupplierId(supplierId, productId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let product = yield ProductTbl.aggregate([
                {
                    $match: {
                        $and: [
                            { supplierId: mdbObjectId(supplierId) },
                            { _id: mdbObjectId(productId) },
                        ],
                    },
                },
                {
                    $project: {
                        variations: 1,
                    },
                },
            ]);
            product = product[0];
            return product;
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param supplierId
 * @param productId
 * @param sku
 * @returns
 */
function variationDeleteService(supplierId, productId, sku) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.findOneAndUpdate({
                $and: [
                    { supplierId: mdbObjectId(supplierId) },
                    { _id: mdbObjectId(productId) },
                ],
            }, { $pull: { variations: { $elemMatch: { sku } } } });
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param supplierId
 * @param productId
 * @returns
 */
function deleteProductService(supplierId, productId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.findOneAndDelete({
                $and: [
                    { _id: mdbObjectId(productId) },
                    { supplierId: mdbObjectId(supplierId) },
                ],
            });
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param supplierId
 * @param productId
 * @param model
 * @param sku
 */
function variationUpdateService(body) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield VariationTbl.updateOne({
                $and: [
                    { _id: mdbObjectId(body === null || body === void 0 ? void 0 : body._id) },
                    { productId: mdbObjectId(body === null || body === void 0 ? void 0 : body.productId) },
                    { supplierId: mdbObjectId(body === null || body === void 0 ? void 0 : body.supplierId) },
                ],
            }, Object.assign({}, body));
        }
        catch (error) {
            throw new Error(`Error in variationUpdateService: ${error === null || error === void 0 ? void 0 : error.message}`);
        }
    });
}
/**
 *
 * @param supplierId
 * @param productId
 * @param model
 * @returns
 */
function variationCreateService(supplierId, productId, model) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.findOneAndUpdate({
                $and: [
                    { _id: mdbObjectId(productId) },
                    { supplierId: mdbObjectId(supplierId) },
                ],
            }, { $push: { variations: model } }, { upsert: true });
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param model
 * @returns
 */
function productListingCreateService(model) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.insertOne(model);
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param productId
 * @returns
 */
function findProductByIdService(productId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.findOne({ _id: mdbObjectId(productId) });
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param supplierId
 * @returns
 */
function countProductsService(supplierId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.countDocuments({
                supplierId: mdbObjectId(supplierId),
            });
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param supplierId
 * @param params
 * @returns
 */
function allProductsBySupplierService(supplierId, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { page, filters, item } = params;
        try {
            return yield VariationTbl.find({ supplierId: mdbObjectId(supplierId) });
            // return await ProductTbl.aggregate([
            //   { $match: { supplierId: mdbObjectId(supplierId) } },
            //   {
            //     $lookup: {
            //       from: "PRODUCT_VARIATION_TBL",
            //       localField: "_id",
            //       foreignField: "productId",
            //       as: "variations",
            //     },
            //   },
            //   {
            //     $addFields: {
            //       totalVariation: {
            //         $cond: {
            //           if: { $isArray: "$variations" },
            //           then: { $size: "$variations" },
            //           else: 0,
            //         },
            //       }
            //     },
            //   },
            //   {
            //     $match: filters,
            //   },
            //   {
            //     $project: {
            //       title: 1,
            //       slug: 1,
            //       categoriesFlat: 1,
            //       variations: 1,
            //       brand: 1,
            //       status: 1,
            //       supplier: 1,
            //       createdAt: 1,
            //       modifiedAt: 1,
            //       isVerified: 1,
            //       totalVariation: 1,
            //     },
            //   },
            //   { $sort: { _id: -1 } },
            //   {
            //     $skip: page * parseInt(item),
            //   },
            //   {
            //     $limit: parseInt(item),
            //   },
            // ]);
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param supplierId
 * @returns
 */
function topSoldProductService(supplierId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.aggregate([
                {
                    $match: { supplierId: mdbObjectId(supplierId) },
                },
                {
                    $addFields: {
                        variations: {
                            $arrayElemAt: ["$variations", 0],
                        },
                    },
                },
                {
                    $project: {
                        totalSold: "$sold",
                        images: "$variations.images",
                        title: "$title",
                        sku: "$variations.sku",
                        brand: "$brand",
                        categories: "$categories",
                        pricing: "$variations.pricing",
                    },
                },
                { $sort: { totalSold: -1 } },
                { $limit: 10 },
            ]);
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param supplierId
 * @returns
 */
function findOrderBySupplierIdService(supplierId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const orders = yield OrderTbl.aggregate([
                { $unwind: { path: "$items" } },
                { $match: { "items.supplierId": mdbObjectId(supplierId) } },
                { $sort: { _id: -1 } },
            ]);
            let orderCounter = yield OrderTbl.aggregate([
                { $unwind: { path: "$items" } },
                { $match: { "items.supplierId": mdbObjectId(supplierId) } },
                {
                    $group: {
                        _id: "$items.supplierId",
                        placeOrderCount: {
                            $sum: {
                                $cond: {
                                    if: { $eq: ["$orderStatus", "placed"] },
                                    then: 1,
                                    else: 0,
                                },
                            },
                        },
                        dispatchOrderCount: {
                            $sum: {
                                $cond: {
                                    if: { $eq: ["$orderStatus", "dispatch"] },
                                    then: 1,
                                    else: 0,
                                },
                            },
                        },
                        totalOrderCount: {
                            $count: {},
                        },
                    },
                },
            ]);
            return { orders, orderCounter };
        }
        catch (error) {
            throw error;
        }
    });
}
function settingService(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield StoreTbl.findOne({ userId: mdbObjectId(userId) });
        }
        catch (error) {
            throw error;
        }
    });
}
module.exports = {
    updateStockService,
    updateMainProductService,
    findProductVariationByIdAndSupplierId,
    variationDeleteService,
    variationUpdateService,
    variationCreateService,
    deleteProductService,
    productListingCreateService,
    findProductByIdService,
    countProductsService,
    allProductsBySupplierService,
    topSoldProductService,
    findOrderBySupplierIdService,
    settingService,
};
