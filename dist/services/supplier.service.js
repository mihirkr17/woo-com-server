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
const ProductTbl = require("../model/product.model");
const OrderTbl = require("../model/order.model");
const { ObjectId: mdbObjectId } = require("mongodb");
/**
 *
 * @param storeId
 * @param productId
 * @param variation
 * @returns
 */
function updateStockService(storeId, productId, variation) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.findOneAndUpdate({
                $and: [
                    { _id: mdbObjectId(productId) },
                    { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @param productId
 * @param values
 * @returns
 */
function updateMainProductService(storeId, productId, values) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.findOneAndUpdate({
                $and: [
                    { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @param productId
 * @returns
 */
function findProductVariationByIdAndSupplierId(storeId, productId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let product = yield ProductTbl.aggregate([
                {
                    $match: {
                        $and: [
                            { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @param productId
 * @param sku
 * @returns
 */
function variationDeleteService(storeId, productId, sku) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.findOneAndUpdate({
                $and: [
                    { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @param productId
 * @returns
 */
function deleteProductService(storeId, productId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.findOneAndDelete({
                $and: [
                    { _id: mdbObjectId(productId) },
                    { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @param productId
 * @param model
 * @param sku
 */
function variationUpdateService(storeId, productId, model, sku) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield ProductTbl.findOneAndUpdate({
                $and: [
                    { _id: mdbObjectId(productId) },
                    { storeId: mdbObjectId(storeId) },
                ],
            }, { $set: { "variations.$[i]": model } }, { arrayFilters: [{ "i.sku": sku }] });
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param storeId
 * @param productId
 * @param model
 * @returns
 */
function variationCreateService(storeId, productId, model) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.findOneAndUpdate({
                $and: [
                    { _id: mdbObjectId(productId) },
                    { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @returns
 */
function countProductsService(storeId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.countDocuments({
                storeId: mdbObjectId(storeId),
            });
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param storeId
 * @param params
 * @returns
 */
function allProductsBySupplierService(storeId, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { page, filters, item } = params;
        try {
            return yield ProductTbl.aggregate([
                { $match: { storeId: mdbObjectId(storeId) } },
                {
                    $addFields: {
                        totalVariation: {
                            $cond: {
                                if: { $isArray: "$variations" },
                                then: { $size: "$variations" },
                                else: 0,
                            },
                        },
                    },
                },
                {
                    $match: filters,
                },
                {
                    $project: {
                        title: 1,
                        slug: 1,
                        imageUrls: 1,
                        categories: 1,
                        variations: 1,
                        brand: 1,
                        _lid: 1,
                        status: 1,
                        supplier: 1,
                        createdAt: 1,
                        modifiedAt: 1,
                        isVerified: 1,
                        totalVariation: 1,
                    },
                },
                { $sort: { _id: -1 } },
                {
                    $skip: page * parseInt(item),
                },
                {
                    $limit: parseInt(item),
                },
            ]);
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 *
 * @param storeId
 * @returns
 */
function topSoldProductService(storeId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ProductTbl.aggregate([
                {
                    $match: { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @returns
 */
function findOrderBySupplierIdService(storeId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const orders = yield OrderTbl.aggregate([
                { $unwind: { path: "$items" } },
                { $match: { "items.storeId": mdbObjectId(storeId) } },
                { $sort: { _id: -1 } },
            ]);
            let orderCounter = yield OrderTbl.aggregate([
                { $unwind: { path: "$items" } },
                { $match: { "items.storeId": mdbObjectId(storeId) } },
                {
                    $group: {
                        _id: "$items.storeId",
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
};
