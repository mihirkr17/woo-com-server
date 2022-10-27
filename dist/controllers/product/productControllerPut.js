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
const { productUpdateModel, productImagesModel, } = require("../../templates/product.template");
module.exports.updateProductController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const db = yield dbConnection();
        const productId = ((_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) || "";
        const body = req.body;
        let model;
        if (body === null || body === void 0 ? void 0 : body.images) {
            model = productImagesModel(body);
        }
        else {
            model = productUpdateModel(body);
        }
        const exists = (yield db
            .collection("users")
            .find({ "shoppingCartItems._id": productId })
            .toArray()) || [];
        if (exists && exists.length > 0) {
            yield db.collection("users").updateMany({ "shoppingCartItems._id": productId }, {
                $pull: { shoppingCartItems: { _id: productId } },
            });
        }
        const result = yield db
            .collection("products")
            .updateOne({ _id: ObjectId(productId) }, { $set: model }, { upsert: true });
        res.status(200).send(result && { message: "Product updated successfully" });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
// Update Product Stock Controller
module.exports.updateStockController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const productId = req.headers.authorization || "";
        const body = req.body;
        if (productId && body) {
            let stock = (body === null || body === void 0 ? void 0 : body.available) <= 1 ? "out" : "in";
            const result = yield db.collection("products").updateOne({ _id: ObjectId(productId) }, {
                $set: {
                    "stockInfo.available": body === null || body === void 0 ? void 0 : body.available,
                    "stockInfo.stock": stock,
                },
            }, { upsert: true });
            if (!result) {
                return res.status(503).send({
                    success: false,
                    statusCode: 503,
                    error: "Failed to update stock quantity !!!",
                });
            }
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Product stock updated successfully.",
            });
        }
    }
    catch (error) {
        res
            .status(500)
            .send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
// product variation controller
module.exports.productVariationController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const db = yield dbConnection();
        const productId = ((_b = req.headers) === null || _b === void 0 ? void 0 : _b.authorization) || "";
        const formTypes = req.query.formType || "";
        const vId = req.query.vId;
        const productAttr = req.query.attr;
        let result;
        let model = req.body;
        if (formTypes === 'new-variation') {
            result = yield db.collection('products').updateOne({
                _id: ObjectId(productId)
            }, {
                $push: { variations: model }
            }, { upsert: true });
        }
        // next condition
        else if (formTypes === 'update') {
            if (vId) {
                if (productAttr === 'variationOne') {
                    result = yield db.collection('products').updateOne({
                        $and: [{ _id: ObjectId(productId) }, { 'variations.vId': vId }]
                    }, {
                        $set: {
                            'variations.$[i].title': model.title,
                            'variations.$[i].slug': model.slug,
                            'variations.$[i].images': model.images,
                            'variations.$[i].sku': model.sku,
                            'variations.$[i].pricing': model.pricing,
                            'variations.$[i].stock': model.stock,
                            'variations.$[i].available': model.available,
                            'variations.$[i].status': model.status,
                        }
                    }, { arrayFilters: [{ "i.vId": vId }] });
                }
                if (productAttr === 'variationTwo') {
                    result = yield db.collection('products').updateOne({
                        $and: [{ _id: ObjectId(productId) }, { 'variations.vId': vId }]
                    }, {
                        $set: { 'variations.$[i].attributes': model }
                    }, { arrayFilters: [{ "i.vId": vId }] });
                }
                if (productAttr === 'variationThree') {
                    result = yield db.collection('products').updateOne({ _id: ObjectId(productId) }, {
                        $set: { bodyInfo: model }
                    }, { upsert: true });
                }
            }
        }
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Data Saved" });
        }
        return res.status(500).send({ success: false, statusCode: 500, error: "Failed" });
    }
    catch (error) {
        return res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
