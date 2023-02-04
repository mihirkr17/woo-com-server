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
module.exports.updateStockController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const db = yield dbConnection();
        const productId = req.headers.authorization || "";
        const body = req.body;
        const storeName = req.params.storeName;
        if (productId && body && storeName) {
            let stock = ((_a = body === null || body === void 0 ? void 0 : body.variations) === null || _a === void 0 ? void 0 : _a.available) <= 1 ? "out" : "in";
            const result = yield db.collection("products").updateOne({ $and: [{ _id: ObjectId(productId) }, { 'sellerData.storeName': storeName }] }, {
                $set: {
                    "variations.$[i].available": (_b = body === null || body === void 0 ? void 0 : body.variations) === null || _b === void 0 ? void 0 : _b.available,
                    "variations.$[i].stock": stock,
                },
            }, {
                arrayFilters: [{ 'i._vId': (_c = body === null || body === void 0 ? void 0 : body.variations) === null || _c === void 0 ? void 0 : _c._vId }]
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
        next(error);
    }
});
// product variation controller
module.exports.productOperationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const db = yield dbConnection();
        const productId = ((_d = req.headers) === null || _d === void 0 ? void 0 : _d.authorization) || "";
        const formTypes = req.query.formType || "";
        const vId = req.query.vId;
        const productAttr = req.query.attr;
        let result;
        let model = req.body;
        // Update variation
        if (formTypes === 'update-variation') {
            model['_vId'] = vId;
            if (vId && productAttr === 'ProductVariations') {
                result = yield db.collection('products').updateOne({
                    $and: [{ _id: ObjectId(productId) }, { 'variations._vId': vId }]
                }, {
                    $set: {
                        'variations.$[i]': model,
                    }
                }, { arrayFilters: [{ "i._vId": vId }] });
            }
        }
        // create new variation
        if (formTypes === 'new-variation') {
            result = yield db.collection('products').updateOne({
                _id: ObjectId(productId)
            }, {
                $push: { variations: model }
            }, { upsert: true });
        }
        // next condition
        else if (formTypes === 'update') {
            if (productAttr === 'ProductSpecs') {
                result = yield db.collection('products').updateOne({ _id: ObjectId(productId) }, {
                    $set: { specification: model }
                }, { upsert: true });
            }
            if (productAttr === 'bodyInformation') {
                result = yield db.collection('products').updateOne({ _id: ObjectId(productId) }, {
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
        next(error);
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
            result = yield db.collection('products').updateOne({ $and: [{ _id: ObjectId((_f = body === null || body === void 0 ? void 0 : body.data) === null || _f === void 0 ? void 0 : _f.pId) }, { _lId: (_g = body === null || body === void 0 ? void 0 : body.data) === null || _g === void 0 ? void 0 : _g.lId }, { save_as: 'fulfilled' }] }, { $set: { 'variations.$[i].status': (_h = body === null || body === void 0 ? void 0 : body.data) === null || _h === void 0 ? void 0 : _h.action } }, { arrayFilters: [{ "i._vId": (_j = body === null || body === void 0 ? void 0 : body.data) === null || _j === void 0 ? void 0 : _j.vId }] });
        }
        else {
            result = yield db.collection('products').updateOne({ $and: [{ _id: ObjectId((_k = body === null || body === void 0 ? void 0 : body.data) === null || _k === void 0 ? void 0 : _k.pId) }, { _lId: (_l = body === null || body === void 0 ? void 0 : body.data) === null || _l === void 0 ? void 0 : _l.lId }] }, { $set: { save_as: (_m = body === null || body === void 0 ? void 0 : body.data) === null || _m === void 0 ? void 0 : _m.action, "variations.$[].status": "inactive" } }, { upsert: true, multi: true });
        }
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: `Request ${(_o = body === null || body === void 0 ? void 0 : body.data) === null || _o === void 0 ? void 0 : _o.action} successful.` });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.viewAllProductsInDashboard = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _p, _q, _r, _s, _t, _u;
    try {
        const db = yield dbConnection();
        // await db.collection("products").createIndex({ _lId: 1, slug: 1, save_as: 1, categories: 1, brand: 1, "sellerData.storeName": 1, "sellerData.sellerName": 1, "sellerData.sellerId": 1 });
        const authEmail = req.decoded.email;
        const role = req.decoded.role;
        const user = yield db.collection("users").findOne({ $and: [{ email: authEmail }, { role }] });
        let item;
        let page;
        item = req.query.items;
        page = req.query.page;
        let searchText = req.query.search;
        let filters = req.query.category;
        let products;
        let draftProducts;
        let inactiveProduct;
        let showFor;
        let src = [];
        if (user.role === 'SELLER') {
            showFor = [
                { "sellerData.storeName": (_q = (_p = user === null || user === void 0 ? void 0 : user.seller) === null || _p === void 0 ? void 0 : _p.storeInfos) === null || _q === void 0 ? void 0 : _q.storeName },
                { save_as: "fulfilled" },
            ];
        }
        else {
            showFor = [{ 'variations.status': "active" }, { save_as: "fulfilled" }];
        }
        page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;
        if (searchText) {
            filters = '';
            src = [
                { title: { $regex: searchText, $options: "i" } },
                { "sellerData.storeName": { $regex: searchText, $options: "i" } },
            ];
        }
        else if (filters) {
            searchText = '';
            if (filters === 'all') {
                src = [{}];
            }
            else {
                src = [{ categories: { $in: [filters] } }];
            }
        }
        products = yield db.collection("products").aggregate([
            {
                $match: {
                    $and: showFor,
                    $or: src
                }
            },
            {
                $skip: page * parseInt(item)
            }, {
                $limit: (parseInt(item))
            }
        ]).toArray();
        draftProducts = yield db.collection("products").find({
            $and: [(user === null || user === void 0 ? void 0 : user.role) === 'SELLER' && { "sellerData.storeName": (_s = (_r = user === null || user === void 0 ? void 0 : user.seller) === null || _r === void 0 ? void 0 : _r.storeInfos) === null || _s === void 0 ? void 0 : _s.storeName }, { save_as: "draft" }],
        }).toArray();
        inactiveProduct = yield db.collection("products").aggregate([
            { $unwind: { path: "$variations" } },
            {
                $match: {
                    $and: [
                        { save_as: 'fulfilled' },
                        (user === null || user === void 0 ? void 0 : user.role) === 'SELLER' && { "sellerData.storeName": (_u = (_t = user === null || user === void 0 ? void 0 : user.seller) === null || _t === void 0 ? void 0 : _t.storeInfos) === null || _u === void 0 ? void 0 : _u.storeName },
                        { "variations.status": 'inactive' }
                    ]
                }
            }
        ]).toArray();
        return res.status(200).send({
            success: true,
            statusCode: 200,
            data: { products, draftProducts, inactiveProduct },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
* @controller      --> Fetch the single product in product edit page.
* @required        --> [req.query:seller, req.query:productId, req.query:variationId]
* @request_method  --> GET
*/
module.exports.getProductForSellerDSBController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const productId = req.query.pid;
        const variationId = req.query.vId;
        const storeName = req.query.storeName;
        let product;
        if (!storeName && typeof storeName === 'undefined' && !productId)
            return res.status(204).send();
        if (variationId && typeof variationId === 'string') {
            product = yield db.collection('products').aggregate([
                {
                    $match: { _id: ObjectId(productId) }
                },
                {
                    $unwind: { path: "$variations" },
                },
                {
                    $match: { 'variations._vId': variationId }
                }
            ]).toArray();
            product = product[0];
        }
        else {
            product = yield db.collection("products").findOne({
                $and: [{ _id: ObjectId(productId) }, { "sellerData.storeName": storeName }],
            });
        }
        return product
            ? res.status(200).send(product)
            : res.status(404).send({
                success: false,
                statusCode: 404,
                error: "Product not found!!!",
            });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Adding Product Title and slug first
 */
module.exports.setProductIntroController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _v, _w, _x;
    try {
        const db = yield dbConnection();
        const authEmail = req.decoded.email;
        const formTypes = req.params.formTypes;
        const body = req.body;
        const lId = ((_v = req.headers) === null || _v === void 0 ? void 0 : _v.authorization) || null;
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
            model.sellerData.storeName = (_x = (_w = user === null || user === void 0 ? void 0 : user.seller) === null || _w === void 0 ? void 0 : _w.storeInfos) === null || _x === void 0 ? void 0 : _x.storeName;
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
            let result = yield db.collection('products').insertOne(model);
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
        next(error);
    }
});
// delete product variation controller
module.exports.deleteProductVariationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const productId = req.params.productId;
        const _vId = req.params.vId;
        const storeName = req.params.storeName;
        const product = yield db.collection('products').findOne({ $and: [{ _id: ObjectId(productId) }, { "sellerData.storeName": storeName }] });
        if (!product) {
            return res.status(404).send({ success: false, statusCode: 404, error: 'Sorry! Product not found!!!' });
        }
        if (product && Array.isArray(product === null || product === void 0 ? void 0 : product.variations) && (product === null || product === void 0 ? void 0 : product.variations.length) <= 1) {
            return res.status(200).send({ success: false, statusCode: 200, message: "Please create another variation before delete this variation !" });
        }
        const result = yield db.collection('products').updateOne({ $and: [{ _id: ObjectId(productId) }, { "sellerData.storeName": storeName }] }, { $pull: { variations: { _vId } } });
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: 'Variation deleted successfully.' });
        }
        return res.status(500).send({ success: false, statusCode: 500, message: 'Failed to delete!!!' });
    }
    catch (error) {
        next(error);
    }
});
module.exports.deleteProductController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _y, _z, _0, _1;
    try {
        const db = yield dbConnection();
        const productId = ((_z = (_y = req.headers) === null || _y === void 0 ? void 0 : _y.authorization) === null || _z === void 0 ? void 0 : _z.split(',')[0]) || "";
        const _lId = ((_1 = (_0 = req.headers) === null || _0 === void 0 ? void 0 : _0.authorization) === null || _1 === void 0 ? void 0 : _1.split(',')[1]) || "";
        const storeName = req.params.storeName;
        //return --> "acknowledged" : true, "deletedCount" : 1
        const deletedProduct = yield db.collection("products").deleteOne({
            $and: [
                { _id: ObjectId(productId) },
                { _lId },
                { 'sellerData.storeName': storeName }
            ]
        });
        if (!deletedProduct.deletedCount) {
            return res.status(503).send({
                success: false,
                statusCode: 503,
                error: "Service unavailable",
            });
        }
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Product deleted successfully.",
        });
    }
    catch (error) {
        next(error);
    }
});
