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
const { ObjectId } = require("mongodb");
module.exports.dashboardOverviewController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const authEmail = req.decoded.email;
        const role = req.decoded.role;
        let topSellers;
        let topSoldProducts;
        let matches;
        const user = yield db.collection("users").findOne({ $and: [{ email: authEmail }, { role }] });
        if ((user === null || user === void 0 ? void 0 : user.role) === 'SELLER') {
            matches = { $match: { $and: [{ 'seller.name': user === null || user === void 0 ? void 0 : user.username }, { 'stockInfo.sold': { $exists: true } }] } };
        }
        if ((user === null || user === void 0 ? void 0 : user.role) === 'ADMIN') {
            topSellers = yield db.collection('users').aggregate([
                { $match: { role: 'SELLER' } },
                {
                    $project: {
                        totalSell: '$inventoryInfo.totalSell',
                        username: '$username',
                        email: '$email',
                        totalProducts: '$inventoryInfo.totalProducts',
                    }
                },
                { $sort: { totalSell: -1 } },
                { $limit: 10 }
            ]).toArray();
            matches = { $match: { 'stockInfo.sold': { $exists: true } } };
        }
        topSoldProducts = yield db.collection('products').aggregate([
            matches,
            {
                $project: {
                    sold: '$stockInfo.sold',
                    images: '$images',
                    title: '$title',
                    seller: '$seller.name',
                    sku: '$sku',
                    brand: '$brand',
                    categories: '$categories',
                    pricing: '$pricing'
                }
            },
            { $sort: { sold: -1 } },
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
