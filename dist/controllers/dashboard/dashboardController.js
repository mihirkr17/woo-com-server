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
const User = require("../../model/user.model");
const Product = require("../../model/product.model");
const Order = require("../../model/order.model");
module.exports.dashboardOverview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const authEmail = req.decoded.email;
        const role = req.decoded.role;
        let topSellers;
        let topSoldProducts;
        let matches;
        const user = yield User.findOne({ $and: [{ email: authEmail }, { role }] });
        if ((user === null || user === void 0 ? void 0 : user.role) === 'SELLER') {
            matches = { $match: { $and: [{ 'sellerData.storeName': (_b = (_a = user === null || user === void 0 ? void 0 : user.seller) === null || _a === void 0 ? void 0 : _a.storeInfos) === null || _b === void 0 ? void 0 : _b.storeName }, { 'variations.totalSold': { $exists: true } }] } };
        }
        if ((user === null || user === void 0 ? void 0 : user.role) === 'ADMIN') {
            topSellers = yield User.aggregate([
                { $match: { role: 'SELLER' } },
                {
                    $project: {
                        totalSold: '$seller.storeInfos.totalSold',
                        storeName: '$seller.storeInfos.storeName',
                        email: '$email',
                        numOfProducts: '$seller.storeInfos.totalProducts',
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 10 }
            ]);
            matches = { $match: { 'seller.storeInfos.totalSold': { $exists: true } } };
        }
        topSoldProducts = yield Product.aggregate([
            { $unwind: { path: '$variations' } },
            matches,
            {
                $project: {
                    totalSold: '$variations.totalSold',
                    images: '$variations.images',
                    title: '$title',
                    storeName: '$sellerData.storeName',
                    sku: '$variations.sku',
                    brand: '$brand',
                    categories: '$categories',
                    pricing: '$variations.pricing'
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);
        return res.status(200).send({ success: true, statusCode: 200, data: { topSellers, topSoldProducts } });
    }
    catch (error) {
        next(error);
    }
});
module.exports.allSellers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sellers = (yield User.find({ $and: [{ isSeller: "fulfilled" }, { role: "SELLER" }] })) || [];
        return res.status(200).send({ success: true, statusCode: 200, sellers });
    }
    catch (error) {
        next(error);
    }
});
module.exports.allBuyers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e;
    try {
        const search = (_c = req.query) === null || _c === void 0 ? void 0 : _c.search;
        let page = (_d = req.query) === null || _d === void 0 ? void 0 : _d.page;
        let item = (_e = req.query) === null || _e === void 0 ? void 0 : _e.item;
        let filter = [];
        item = parseInt(item) || 2;
        page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;
        let totalBuyerCount;
        if (search && search !== "") {
            filter = [{
                    $match: {
                        $and: [{ idFor: "buy" }, { role: "BUYER" }],
                        $or: [{ email: { $regex: search, $options: 'mi' } }]
                    }
                }];
        }
        else {
            filter = [
                {
                    $match: {
                        $and: [{ idFor: "buy" }, { role: "BUYER" }],
                    }
                }, { $skip: (page * item) || 0 }, { $limit: item }
            ];
            totalBuyerCount = (yield User.countDocuments({
                $and: [{ idFor: "buy" }, { role: "BUYER" }],
            })) || 0;
        }
        const buyers = (yield User.aggregate(filter)) || [];
        return res.status(200).send({ success: true, statusCode: 200, buyers, totalBuyerCount });
    }
    catch (error) {
        next(error);
    }
});
