"use strict";
// Admin.controller.tsx
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
const User = require("../../model/user.model");
const Supplier = require("../../model/supplier.model");
const email_service = require("../../services/email.service");
const Order = require("../../model/order.model");
const { Api400Error, Api403Error, Api404Error, Api500Error } = require("../../errors/apiResponse");
const { ObjectId } = require('mongodb');
// Controllers...
module.exports.getAdminController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pages = req.query.pages;
        const item = req.query.items;
        let queueProducts;
        let countQueueProducts = yield Product.countDocuments({ status: "Queue" });
        const suppliers = yield Supplier.find();
        const buyers = yield User.find();
        let cursor = yield Product.find({ isVerified: false, status: "Queue" });
        if (pages || item) {
            queueProducts = yield cursor.skip(parseInt(pages) > 0 ? ((pages - 1) * item) : 0).limit(item);
        }
        else {
            queueProducts = yield cursor;
        }
        return res.status(200).send({ success: true, statusCode: 200, queueProducts, countQueueProducts, suppliers, buyers });
    }
    catch (error) {
        next(error);
    }
});
module.exports.takeThisProductByAdminController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
                verifiedAt: new Date(Date.now())
            }
        }, { upsert: true });
        if ((result === null || result === void 0 ? void 0 : result.upsertedCount) === 1) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully launched." });
        }
        else {
            return res.status(200).send({ success: false, statusCode: 200, message: "Product not taken !" });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.verifySellerAccountByAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { uuid, id, email } = req.body;
        if (!uuid || typeof uuid === "undefined")
            throw new Api400Error("Required user unique id !");
        if (!id || typeof id === "undefined")
            throw new Api400Error("Required id !");
        const result = yield User.findOneAndUpdate({ $and: [{ _id: ObjectId(id) }, { email }, { _uuid: uuid }, { isSeller: "pending" }] }, {
            $set: {
                accountStatus: "Active",
                isSeller: "fulfilled",
                becomeSellerAt: new Date()
            }
        }, {
            upsert: true
        });
        if (result) {
            yield email_service({
                to: result === null || result === void 0 ? void 0 : result.email,
                subject: "Verify email address",
                html: `
               <h5>Thanks for with us !</h5>
               <p style="color: 'green'">We have verified your seller account. Now you can login your seller id.</p>
            `
            });
            return res.status(200).send({ success: true, statusCode: 200, message: "Permission granted." });
        }
        throw new Api500Error("Internal problem !");
    }
    catch (error) {
        next(error);
    }
});
module.exports.deleteSupplierAccount = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, email } = req.body;
        if (!id || typeof id === "undefined")
            throw new Api400Error("Required id !");
        if (!ObjectId.isValid(id))
            throw new Api400Error("Invalid supplier id !");
        const result = yield Supplier.deleteOne({ $and: [{ _id: ObjectId(id) }, { email }] });
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Account deleted successfully." });
        }
        throw new Api500Error("Internal server error !");
    }
    catch (error) {
        next(error);
    }
});
module.exports.getBuyerInfoByAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, email } = req.body;
        const order = yield Order.findOne({ user_email: email });
        if (order) {
            let totalOrder = Array.isArray(order === null || order === void 0 ? void 0 : order.orders) && (order === null || order === void 0 ? void 0 : order.orders.length) || 0;
            return res.status(200).send({
                success: true, statusCode: 200, data: {
                    totalOrder
                }
            });
        }
        throw new Api404Error("Data not found !");
    }
    catch (error) {
        next(error);
    }
});
