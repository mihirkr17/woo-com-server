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
const QueueProduct = require("../../model/queueProduct.model");
const Product = require("../../model/product.model");
// Controllers...
module.exports.getAdminController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pages = req.query.pages;
        const item = req.query.items;
        let queueProducts;
        let countQueueProducts = yield QueueProduct.countDocuments({ isVerified: false, save_as: "queue" });
        if (pages || item) {
            queueProducts = yield QueueProduct.find({ isVerified: false }).skip(parseInt(pages) > 0 ? ((pages - 1) * item) : 0).limit(item);
        }
        else {
            queueProducts = yield QueueProduct.find({ isVerified: false });
        }
        return res.status(200).send({ success: true, statusCode: 200, data: { queueProducts, countQueueProducts } });
    }
    catch (error) {
        next(error);
    }
});
module.exports.takeThisProductByAdminController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const listingID = req.headers.authorization || "";
        const adminEmail = req.decoded.email;
        const role = req.decoded.role;
        if (!listingID) {
            throw new Error("Listing ID required !");
        }
        var queueProduct = yield QueueProduct.findOne({ _LID: listingID }, { __v: 0 });
        if (!queueProduct) {
            throw new Error("Sorry product not found !");
        }
        queueProduct.isVerified = true;
        queueProduct.save_as = "draft";
        queueProduct["verifyStatus"] = { verifiedBy: role, email: adminEmail, verifiedAt: new Date(Date.now()) };
        let filter = { $and: [{ _id: ObjectId(queueProduct === null || queueProduct === void 0 ? void 0 : queueProduct._id) }, { _LID: queueProduct === null || queueProduct === void 0 ? void 0 : queueProduct._LID }] };
        const result = yield Product.updateOne(filter, { $set: queueProduct }, { upsert: true });
        if ((result === null || result === void 0 ? void 0 : result.upsertedCount) === 1) {
            yield QueueProduct.deleteOne(filter);
            return res.status(200).send({ success: true, statusCode: 200, message: "Product taken." });
        }
        else {
            return res.status(200).send({ success: false, statusCode: 200, message: "Product not taken !" });
        }
    }
    catch (error) {
        next(error);
    }
});
