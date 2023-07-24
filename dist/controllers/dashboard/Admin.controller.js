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
const email_service = require("../../services/email.service");
const apiResponse = require("../../errors/apiResponse");
const Order = require("../../model/order.model");
const { ObjectId } = require('mongodb');
// Controllers...
module.exports.getAdminController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pages = req.query.pages;
        const item = req.query.items;
        let queueProducts;
        let countQueueProducts = yield Product.countDocuments({ status: "queue" });
        let newSellers = yield User.find({ $and: [{ isSeller: 'pending' }, { role: "SELLER" }] });
        const sellers = yield User.find({ $and: [{ isSeller: "fulfilled" }, { role: "SELLER" }] });
        const buyers = yield User.find({ $and: [{ idFor: "buy" }, { role: "BUYER" }] });
        let cursor = yield Product.find({ isVerified: false, status: "queue" });
        if (pages || item) {
            queueProducts = yield cursor.skip(parseInt(pages) > 0 ? ((pages - 1) * item) : 0).limit(item);
        }
        else {
            queueProducts = yield cursor;
        }
        return res.status(200).send({ success: true, statusCode: 200, queueProducts, countQueueProducts, newSellers, sellers, buyers });
    }
    catch (error) {
        next(error);
    }
});
module.exports.takeThisProductByAdminController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminEmail = req.decoded.email;
        const role = req.decoded.role;
        const { listingID } = req.body;
        if (!listingID) {
            throw new Error("Listing ID required !");
        }
        const result = yield Product.updateOne({ $and: [{ _lid: listingID }, { status: "queue" }] }, {
            $set: {
                isVerified: true,
                status: "active",
                verifyStatus: { verifiedBy: role, email: adminEmail, verifiedAt: new Date(Date.now()) }
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
            throw new apiResponse.Api400Error("Required user unique id !");
        if (!id || typeof id === "undefined")
            throw new apiResponse.Api400Error("Required id !");
        const result = yield User.findOneAndUpdate({ $and: [{ _id: ObjectId(id) }, { email }, { _uuid: uuid }, { isSeller: "pending" }] }, {
            $set: {
                accountStatus: "active",
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
        throw new apiResponse.Api500Error("Internal problem !");
    }
    catch (error) {
        next(error);
    }
});
module.exports.deleteSellerAccountRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, uuid, email } = req.body;
        if (!uuid || typeof uuid === "undefined")
            throw new apiResponse.Api400Error("Required user unique id !");
        if (!id || typeof id === "undefined")
            throw new apiResponse.Api400Error("Required id !");
        const result = yield User.deleteOne({ $and: [{ _id: ObjectId(id) }, { _uuid: uuid }, { email }] });
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Account deleted successfully." });
        }
        throw new apiResponse.Api500Error("Internal error !");
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
        throw new apiResponse.Api404Error("Data not found !");
    }
    catch (error) {
        next(error);
    }
});
