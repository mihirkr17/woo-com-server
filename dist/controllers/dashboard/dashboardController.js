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
var { dbConnection } = require("../../utils/db");
const User = require("../../model/user.model");
module.exports.dashboardOverview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const db = yield dbConnection();
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
            ]).toArray();
            matches = { $match: { 'seller.storeInfos.totalSold': { $exists: true } } };
        }
        topSoldProducts = yield db.collection('products').aggregate([
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
        ]).toArray();
        return res.status(200).send({ success: true, statusCode: 200, data: { topSellers, topSoldProducts } });
    }
    catch (error) {
        return res
            .status(500)
            .send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
