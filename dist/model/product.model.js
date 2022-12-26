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
var conn = require("../utils/db");
var mongodb = require("mongodb");
module.exports.productCounter = (seller = '') => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let db = yield conn.dbConnection();
        let filter;
        if (seller) {
            filter = { $and: [{ status: "active" }, { 'seller.name': seller }, { save_as: 'fulfilled' }] };
        }
        else {
            filter = { $and: [{ status: 'active' }, { save_as: 'fulfilled' }] };
        }
        const totalProducts = yield db.collection('products').countDocuments(filter);
        if (!totalProducts && typeof totalProducts !== 'number') {
            return false;
        }
        return totalProducts;
    }
    catch (error) {
        return error.message;
    }
});
module.exports.productCounterAndSetter = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let db = yield conn.dbConnection();
        let totalProducts = yield db.collection('products').countDocuments({ $and: [{ 'seller.name': user.username }, { 'seller.uuid': mongodb.ObjectId(user._id) }] });
        if (!totalProducts && typeof totalProducts !== 'number') {
            return false;
        }
        const updateSellerInventor = yield db.collection('users').updateOne({ $and: [{ email: user.email }, { role: user.role }] }, { $set: { 'inventoryInfo.totalProducts': (totalProducts || 0) } }, { upsert: true });
        return updateSellerInventor ? true : false;
    }
    catch (error) {
        return error.message;
    }
});
module.exports.productByCategories = (product, limit = 1000) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let db = yield conn.dbConnection();
        let relatedProducts = yield db.collection('products').aggregate([
            {
                $match: {
                    $and: [
                        { categories: { $in: product.categories } },
                        { slug: { $ne: product.slug } },
                        { status: "active" },
                        { save_as: 'fulfilled' }
                    ]
                }
            },
            { $project: { slug: "$slug", title: "$title", pricing: "$pricing", ratingAverage: "$ratingAverage", brand: "$brand" } },
            { $limit: limit }
        ]).toArray();
    }
    catch (error) {
    }
});
// top selling products
module.exports.topSellingProducts = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let db = yield conn.dbConnection();
        return yield db.collection("products").aggregate([
            { $unwind: { path: '$variations' } },
            { $match: { 'variations.status': "active" } },
            { $sort: { 'variations.totalSold': -1 } },
            { $limit: 6 }
        ]).toArray();
    }
    catch (error) {
        return error === null || error === void 0 ? void 0 : error.message;
    }
});
// top rated products
module.exports.topRatedProducts = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield conn.dbConnection();
        return yield db.collection("products").aggregate([
            { $addFields: { variations: { $first: "$variations" } } },
            { $match: { 'variations.status': 'active' } },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    variations: 1,
                    brand: 1,
                    packageInfo: 1,
                    rating: 1,
                    ratingAverage: 1,
                    _lId: 1,
                    reviews: 1
                }
            },
            { $sort: { ratingAverage: -1 } },
            { $limit: 6 }
        ]).toArray();
    }
    catch (error) {
        return error === null || error === void 0 ? void 0 : error.message;
    }
});
// Fetch all products
module.exports.allProducts = (limits) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield conn.dbConnection();
        return yield db.collection('products').aggregate([
            { $addFields: { variations: { $first: "$variations" } } },
            { $match: { 'variations.status': 'active' } },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    variations: 1,
                    brand: 1,
                    packageInfo: 1,
                    rating: 1,
                    ratingAverage: 1,
                    _lId: 1,
                    reviews: 1
                }
            },
            { $sort: { 'variations._vId': -1 } },
            { $limit: limits }
        ]).toArray();
    }
    catch (error) {
        return error === null || error === void 0 ? void 0 : error.message;
    }
});
