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
// Update Product Stock Controller
module.exports.updateStockController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const db = yield dbConnection();
        const productID = req.headers.authorization || "";
        const body = req.body;
        if (productID && body) {
            let stock = ((_a = body === null || body === void 0 ? void 0 : body.variations) === null || _a === void 0 ? void 0 : _a.available) <= 1 ? "out" : "in";
            const result = yield db.collection("products").updateOne({ _id: ObjectId(productID) }, {
                $set: {
                    "variations.$[i].available": (_b = body === null || body === void 0 ? void 0 : body.variations) === null || _b === void 0 ? void 0 : _b.available,
                    "variations.$[i].stock": stock,
                },
            }, {
                arrayFilters: [{ 'i._VID': (_c = body === null || body === void 0 ? void 0 : body.variations) === null || _c === void 0 ? void 0 : _c._VID }]
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
module.exports.productOperationController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const db = yield dbConnection();
        const productID = ((_d = req.headers) === null || _d === void 0 ? void 0 : _d.authorization) || "";
        const formTypes = req.query.formType || "";
        const vId = req.query.vId;
        const productAttr = req.query.attr;
        let result;
        let model = req.body;
        // Update variation
        if (formTypes === 'update-variation') {
            model['_VID'] = vId;
            if (vId && productAttr === 'ProductVariations') {
                result = yield db.collection('products').updateOne({
                    $and: [{ _id: ObjectId(productID) }, { 'variations._VID': vId }]
                }, {
                    $set: {
                        'variations.$[i]': model,
                    }
                }, { arrayFilters: [{ "i._VID": vId }] });
            }
        }
        // create new variation
        if (formTypes === 'new-variation') {
            result = yield db.collection('products').updateOne({
                _id: ObjectId(productID)
            }, {
                $push: { variations: model }
            }, { upsert: true });
        }
        // next condition
        else if (formTypes === 'update') {
            if (productAttr === 'ProductSpecs') {
                result = yield db.collection('products').updateOne({ _id: ObjectId(productID) }, {
                    $set: { specification: model }
                }, { upsert: true });
            }
            if (productAttr === 'bodyInformation') {
                result = yield db.collection('products').updateOne({ _id: ObjectId(productID) }, {
                    $set: { bodyInfo: model }
                }, { upsert: true });
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
module.exports.productControlController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g, _h, _j, _k, _l, _m, _o;
    try {
        const db = yield dbConnection();
        const body = req.body;
        let result;
        if ((body === null || body === void 0 ? void 0 : body.market_place) !== 'woo-kart') {
            return res.status(403).send({ success: false, statusCode: 403, error: "Forbidden." });
        }
        if ((_e = body === null || body === void 0 ? void 0 : body.data) === null || _e === void 0 ? void 0 : _e.vId) {
            result = yield db.collection('products').updateOne({ $and: [{ _id: ObjectId((_f = body === null || body === void 0 ? void 0 : body.data) === null || _f === void 0 ? void 0 : _f.pId) }, { _LID: (_g = body === null || body === void 0 ? void 0 : body.data) === null || _g === void 0 ? void 0 : _g.lId }, { save_as: 'fulfilled' }] }, { $set: { 'variations.$[i].status': (_h = body === null || body === void 0 ? void 0 : body.data) === null || _h === void 0 ? void 0 : _h.action } }, { arrayFilters: [{ "i._VID": (_j = body === null || body === void 0 ? void 0 : body.data) === null || _j === void 0 ? void 0 : _j.vId }] });
        }
        else {
            result = yield db.collection('products').updateOne({ $and: [{ _id: ObjectId((_k = body === null || body === void 0 ? void 0 : body.data) === null || _k === void 0 ? void 0 : _k.pId) }, { _LID: (_l = body === null || body === void 0 ? void 0 : body.data) === null || _l === void 0 ? void 0 : _l.lId }] }, { $set: { save_as: (_m = body === null || body === void 0 ? void 0 : body.data) === null || _m === void 0 ? void 0 : _m.action, "variations.$[].status": "inactive" } }, { upsert: true, multi: true });
        }
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: `Request ${(_o = body === null || body === void 0 ? void 0 : body.data) === null || _o === void 0 ? void 0 : _o.action} successful.` });
        }
    }
    catch (error) {
        next(error);
    }
});
