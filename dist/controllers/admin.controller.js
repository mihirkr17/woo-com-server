"use strict";
// src/controllers/admin.controller.ts
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
const Product = require("../model/PRODUCT_TBL");
const User = require("../model/user.model");
const Store = require("../model/store.model");
const smtpSender = require("../services/email.service");
const Order = require("../model/ORDER_TBL");
const { Api400Error, Api403Error, Api404Error, Api500Error, } = require("../errors/apiResponse");
/**
 *
 * @param req
 * @param res
 * @param next
 */
function adminOverview(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pages = req.query.pages;
            const item = req.query.items;
            let queueProducts;
            let countQueueProducts = yield Product.countDocuments({ status: "Queue" });
            const suppliers = yield User.find({ role: "SUPPLIER" });
            const customers = yield User.find({ role: "CUSTOMER" });
            let cursor = yield Product.find({ isVerified: false, status: "Queue" });
            if (pages || item) {
                queueProducts = yield cursor
                    .skip(parseInt(pages) > 0 ? (pages - 1) * item : 0)
                    .limit(item);
            }
            else {
                queueProducts = yield cursor;
            }
            return res.status(200).send({
                success: true,
                statusCode: 200,
                queueProducts,
                countQueueProducts,
                suppliers,
                customers,
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function verifyThisProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { role, email } = req === null || req === void 0 ? void 0 : req.decoded;
            const { productId } = req.body;
            if (role !== "ADMIN")
                throw new Api403Error("Forbidden !");
            if (!productId) {
                throw new Api403Error("Product ID required !");
            }
            const result = yield Product.findOneAndUpdate({ $and: [{ _id: ObjectId(productId) }, { status: "Queue" }] }, {
                $set: {
                    isVerified: true,
                    status: "Active",
                    verifiedBy: email,
                    verifiedAt: new Date(Date.now()),
                },
            }, { upsert: true });
            if ((result === null || result === void 0 ? void 0 : result.upsertedCount) === 1) {
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "Product successfully launched.",
                });
            }
            else {
                return res.status(200).send({
                    success: false,
                    statusCode: 200,
                    message: "Product not taken !",
                });
            }
        }
        catch (error) {
            next(error);
        }
    });
}
function verifySellerAccount(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { uuid, id, email } = req.body;
            if (!uuid || typeof uuid === "undefined")
                throw new Api400Error("Required user unique id !");
            if (!id || typeof id === "undefined")
                throw new Api400Error("Required id !");
            const result = yield User.findOneAndUpdate({
                $and: [
                    { _id: ObjectId(id) },
                    { email },
                    { _uuid: uuid },
                    { isSeller: "pending" },
                ],
            }, {
                $set: {
                    accountStatus: "Active",
                    isSeller: "fulfilled",
                    becomeSellerAt: new Date(),
                },
            }, {
                upsert: true,
            });
            if (result) {
                yield smtpSender({
                    to: result === null || result === void 0 ? void 0 : result.email,
                    subject: "Verify email address",
                    html: `
               <h5>Thanks for with us !</h5>
               <p style="color: 'green'">We have verified your seller account. Now you can login your seller id.</p>
            `,
                });
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "Permission granted.",
                });
            }
            throw new Api500Error("Internal problem !");
        }
        catch (error) {
            next(error);
        }
    });
}
function deleteSupplierAccount(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id, email } = req.body;
            if (!id || typeof id === "undefined")
                throw new Api400Error("Required id !");
            if (!ObjectId.isValid(id))
                throw new Api400Error("Invalid supplier id !");
            yield User.deleteOne({
                $and: [{ _id: ObjectId(id) }, { email }],
            });
            yield Store.deleteOne({ userId: ObjectId(id) });
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Account deleted successfully.",
            });
            throw new Api500Error("Internal server error !");
        }
        catch (error) {
            next(error);
        }
    });
}
function getBuyerInfo(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id, email } = req.body;
            const order = yield Order.findOne({ user_email: email });
            if (order) {
                let totalOrder = (Array.isArray(order === null || order === void 0 ? void 0 : order.orders) && (order === null || order === void 0 ? void 0 : order.orders.length)) || 0;
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    data: {
                        totalOrder,
                    },
                });
            }
            throw new Api404Error("Data not found !");
        }
        catch (error) {
            next(error);
        }
    });
}
function allSuppliers(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sellers = (yield User.find({
                $and: [{ isSeller: "fulfilled" }, { role: "SELLER" }],
            })) || [];
            return res.status(200).send({ success: true, statusCode: 200, sellers });
        }
        catch (error) {
            next(error);
        }
    });
}
function allBuyers(req, res, next) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const search = (_a = req.query) === null || _a === void 0 ? void 0 : _a.search;
            let page = (_b = req.query) === null || _b === void 0 ? void 0 : _b.page;
            let item = (_c = req.query) === null || _c === void 0 ? void 0 : _c.item;
            let filter = [];
            item = parseInt(item) || 2;
            page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;
            let totalBuyerCount;
            if (search && search !== "") {
                filter = [
                    {
                        $match: {
                            $and: [{ idFor: "buy" }, { role: "CUSTOMER" }],
                            $or: [{ email: { $regex: search, $options: "mi" } }],
                        },
                    },
                ];
            }
            else {
                filter = [
                    {
                        $match: {
                            $and: [{ idFor: "buy" }, { role: "CUSTOMER" }],
                        },
                    },
                    { $skip: page * item || 0 },
                    { $limit: item },
                ];
                totalBuyerCount =
                    (yield User.countDocuments({
                        $and: [{ idFor: "buy" }, { role: "CUSTOMER" }],
                    })) || 0;
            }
            const buyers = (yield User.aggregate(filter)) || [];
            return res
                .status(200)
                .send({ success: true, statusCode: 200, buyers, totalBuyerCount });
        }
        catch (error) {
            next(error);
        }
    });
}
module.exports = {
    adminOverview,
    verifyThisProduct,
    verifySellerAccount,
    deleteSupplierAccount,
    getBuyerInfo,
    allSuppliers,
    allBuyers,
};
