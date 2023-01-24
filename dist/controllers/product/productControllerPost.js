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
const { productIntroTemplate } = require("../../templates/product.template");
/**
 * Adding Product Title and slug first
 */
module.exports.setProductIntroController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const db = yield dbConnection();
        const authEmail = req.decoded.email;
        const formTypes = req.params.formTypes;
        const body = req.body;
        const lId = ((_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) || null;
        let model;
        const user = yield db
            .collection("users")
            .findOne({ $and: [{ email: authEmail }, { role: 'SELLER' }] });
        if (!user) {
            return res
                .status(401)
                .send({ success: false, statusCode: 401, error: "Unauthorized" });
        }
        if (formTypes === "update" && lId) {
            model = productIntroTemplate(body);
            model['modifiedAt'] = new Date(Date.now());
            let result = yield db
                .collection("products")
                .updateOne({ _lId: lId }, { $set: model }, { upsert: true });
            if (result) {
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "Product updated successfully.",
                });
            }
            else {
                return res.status(400).send({
                    success: false,
                    statusCode: 400,
                    error: "Operation failed!!!",
                });
            }
        }
        if (formTypes === 'create') {
            model = productIntroTemplate(body);
            model['_lId'] = "LID" + Math.random().toString(36).toUpperCase().slice(2, 18);
            model['sellerData'] = {};
            model.sellerData.sellerId = user === null || user === void 0 ? void 0 : user._UUID;
            model.sellerData.sellerName = user === null || user === void 0 ? void 0 : user.fullName;
            model.sellerData.storeName = (_c = (_b = user === null || user === void 0 ? void 0 : user.seller) === null || _b === void 0 ? void 0 : _b.storeInfos) === null || _c === void 0 ? void 0 : _c.storeName;
            model['createdAt'] = new Date(Date.now());
            model["rating"] = [
                { weight: 5, count: 0 },
                { weight: 4, count: 0 },
                { weight: 3, count: 0 },
                { weight: 2, count: 0 },
                { weight: 1, count: 0 },
            ];
            model["ratingAverage"] = 0;
            model['reviews'] = [];
            model['save_as'] = 'draft';
            let result = yield db.collection('product').insertOne(model);
            if (result) {
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "Data saved.",
                });
            }
        }
    }
    catch (error) {
        res
            .status(500)
            .send({ success: false, statusCode: 500, error: error.message });
    }
});
