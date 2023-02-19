"use strict";
// ManageProduct.Controller.tsx
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
const { ObjectId } = require("mongodb");
const { product_listing_template_engine } = require("../../templates/product.template");
const User = require("../../model/user.model");
const QueueProduct = require("../../model/queueProduct.model");
const Product = require("../../model/product.model");
// Controllers
module.exports.updateStockController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const productID = req.headers.authorization || "";
        const body = req.body;
        const storeName = req.params.storeName;
        if (!((_a = body === null || body === void 0 ? void 0 : body.variations) === null || _a === void 0 ? void 0 : _a._VID) || !((_b = body === null || body === void 0 ? void 0 : body.variations) === null || _b === void 0 ? void 0 : _b.available)) {
            throw new Error("Variation ID and unit required !");
        }
        if (productID && body && storeName) {
            let stock = ((_c = body === null || body === void 0 ? void 0 : body.variations) === null || _c === void 0 ? void 0 : _c.available) <= 1 ? "out" : "in";
            const result = yield Product.findOneAndUpdate({ $and: [{ _id: ObjectId(productID) }, { 'sellerData.storeName': storeName }] }, {
                $set: {
                    "variations.$[i].available": (_d = body === null || body === void 0 ? void 0 : body.variations) === null || _d === void 0 ? void 0 : _d.available,
                    "variations.$[i].stock": stock,
                },
            }, {
                arrayFilters: [{ "i._VID": (_e = body === null || body === void 0 ? void 0 : body.variations) === null || _e === void 0 ? void 0 : _e._VID }]
            });
            if (!result) {
                return res.status(500).send({
                    success: false,
                    statusCode: 500,
                    name: "Server Error",
                    message: "Failed to update stock quantity !!!",
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
    var _f;
    try {
        const productID = ((_f = req.headers) === null || _f === void 0 ? void 0 : _f.authorization) || "";
        const formTypes = req.query.formType || "";
        const vId = req.query.vId;
        const productAttr = req.query.attr;
        let result;
        let model = req.body;
        // Update variation
        if (formTypes === 'update-variation') {
            model['_VID'] = vId;
            if (vId && productAttr === 'ProductVariations') {
                result = yield Product.findOneAndUpdate({
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
            result = yield Product.updateOne({
                _id: ObjectId(productID)
            }, {
                $push: { variations: model }
            }, { upsert: true });
        }
        // next condition
        else if (formTypes === 'update') {
            if (productAttr === 'ProductSpecs') {
                result = yield Product.updateOne({ _id: ObjectId(productID) }, {
                    $set: { specification: model }
                }, { upsert: true });
            }
            if (productAttr === 'bodyInformation') {
                result = yield Product.updateOne({ _id: ObjectId(productID) }, {
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
    var _g, _h, _j, _k, _l, _m, _o, _p, _q;
    try {
        const body = req.body;
        let result;
        if ((body === null || body === void 0 ? void 0 : body.market_place) !== 'woo-kart') {
            return res.status(403).send({ success: false, statusCode: 403, error: "Forbidden." });
        }
        if ((_g = body === null || body === void 0 ? void 0 : body.data) === null || _g === void 0 ? void 0 : _g.vId) {
            result = yield Product.findOneAndUpdate({
                $and: [
                    { _id: ObjectId((_h = body === null || body === void 0 ? void 0 : body.data) === null || _h === void 0 ? void 0 : _h.pId) },
                    { _LID: (_j = body === null || body === void 0 ? void 0 : body.data) === null || _j === void 0 ? void 0 : _j.lId },
                    { save_as: 'fulfilled' }
                ]
            }, { $set: { 'variations.$[i].status': (_k = body === null || body === void 0 ? void 0 : body.data) === null || _k === void 0 ? void 0 : _k.action } }, { arrayFilters: [{ "i._VID": (_l = body === null || body === void 0 ? void 0 : body.data) === null || _l === void 0 ? void 0 : _l.vId }] });
        }
        else {
            result = yield Product.findOneAndUpdate({
                $and: [
                    { _id: ObjectId((_m = body === null || body === void 0 ? void 0 : body.data) === null || _m === void 0 ? void 0 : _m.pId) },
                    { _LID: (_o = body === null || body === void 0 ? void 0 : body.data) === null || _o === void 0 ? void 0 : _o.lId }
                ]
            }, { $set: { save_as: (_p = body === null || body === void 0 ? void 0 : body.data) === null || _p === void 0 ? void 0 : _p.action, "variations.$[].status": "inactive" } }, { upsert: true, multi: true });
        }
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: `Request ${(_q = body === null || body === void 0 ? void 0 : body.data) === null || _q === void 0 ? void 0 : _q.action} successful.` });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.viewAllProductsInDashboard = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _r, _s, _t, _u, _v, _w;
    try {
        // await db.collection("products").createIndex({ _LID: 1, slug: 1, save_as: 1, categories: 1, brand: 1, "sellerData.storeName": 1, "sellerData.sellerName": 1, "sellerData.sellerID": 1 });
        const authEmail = req.decoded.email;
        const role = req.decoded.role;
        const user = yield User.findOne({ $and: [{ email: authEmail }, { role }] });
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
                { "sellerData.storeName": (_s = (_r = user === null || user === void 0 ? void 0 : user.seller) === null || _r === void 0 ? void 0 : _r.storeInfos) === null || _s === void 0 ? void 0 : _s.storeName },
                { save_as: "fulfilled" },
                { isVerified: true }
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
            src = [{ categories: { $in: [filters] } }];
        }
        else {
            src = [{}];
        }
        products = yield Product.aggregate([
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
        ]);
        //  products = await Product.aggregate([
        //       { $match: { $and: showFor, $or: src } },
        //       { $unwind: { path: "$variations" } },
        //       { $replaceRoot: { newRoot: { $mergeObjects: ["$variations", "$$ROOT"] } } },
        //       { $unset: ["variations"] },
        //       { $skip: page * parseInt(item) },
        //       { $limit: (parseInt(item)) }
        //    ]);
        draftProducts = yield Product.find({
            $and: [(user === null || user === void 0 ? void 0 : user.role) === 'SELLER' && { "sellerData.storeName": (_u = (_t = user === null || user === void 0 ? void 0 : user.seller) === null || _t === void 0 ? void 0 : _t.storeInfos) === null || _u === void 0 ? void 0 : _u.storeName }, { save_as: "draft" }],
        });
        inactiveProduct = yield Product.aggregate([
            { $unwind: { path: "$variations" } },
            {
                $match: {
                    $and: [
                        { save_as: 'fulfilled' },
                        (user === null || user === void 0 ? void 0 : user.role) === 'SELLER' && { "sellerData.storeName": (_w = (_v = user === null || user === void 0 ? void 0 : user.seller) === null || _v === void 0 ? void 0 : _v.storeInfos) === null || _w === void 0 ? void 0 : _w.storeName },
                        { "variations.status": 'inactive' }
                    ]
                }
            }
        ]);
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
* @required        --> [req.query:seller, req.query:productID, req.query:variationID]
* @request_method  --> GET
*/
module.exports.getProductForSellerDSBController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productID = req.query.pid;
        const variationID = req.query.vId;
        const storeName = req.query.storeName;
        let product;
        if (!storeName && typeof storeName === 'undefined' && !productID)
            return res.status(204).send();
        if (variationID && typeof variationID === 'string') {
            product = yield Product.aggregate([
                {
                    $match: { _id: ObjectId(productID) }
                },
                {
                    $unwind: { path: "$variations" },
                },
                {
                    $match: { 'variations._VID': variationID }
                }
            ]);
            product = product[0];
        }
        else {
            product = yield Product.findOne({
                $and: [{ _id: ObjectId(productID) }, { "sellerData.storeName": storeName }],
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
module.exports.productListingController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _x, _y, _z, _0, _1;
    try {
        const authEmail = req.decoded.email;
        const formTypes = req.params.formTypes;
        const body = req.body;
        const lId = ((_x = req.headers) === null || _x === void 0 ? void 0 : _x.authorization) || null;
        let model;
        const user = yield User.findOne({ $and: [{ email: authEmail }, { role: 'SELLER' }] });
        if (!user) {
            return res
                .status(401)
                .send({ success: false, statusCode: 401, error: "Unauthorized" });
        }
        if (formTypes === "update" && lId) {
            model = product_listing_template_engine(body);
            model['modifiedAt'] = new Date(Date.now());
            model.sellerData.sellerID = user === null || user === void 0 ? void 0 : user._UUID;
            model.sellerData.sellerName = user === null || user === void 0 ? void 0 : user.fullName;
            model.sellerData.storeName = (_z = (_y = user === null || user === void 0 ? void 0 : user.seller) === null || _y === void 0 ? void 0 : _y.storeInfos) === null || _z === void 0 ? void 0 : _z.storeName;
            let result = yield Product.updateOne({ _LID: lId, save_as: { $and: ['draft', 'fulfilled'] } }, { $set: model }, { upsert: true });
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
            model = product_listing_template_engine(body);
            model.sellerData.sellerID = user === null || user === void 0 ? void 0 : user._UUID;
            model.sellerData.sellerName = user === null || user === void 0 ? void 0 : user.fullName;
            model.sellerData.storeName = (_1 = (_0 = user === null || user === void 0 ? void 0 : user.seller) === null || _0 === void 0 ? void 0 : _0.storeInfos) === null || _1 === void 0 ? void 0 : _1.storeName;
            model["rating"] = [
                { weight: 5, count: 0 },
                { weight: 4, count: 0 },
                { weight: 3, count: 0 },
                { weight: 2, count: 0 },
                { weight: 1, count: 0 },
            ];
            model["ratingAverage"] = 0;
            model['reviews'] = [];
            model['save_as'] = 'queue';
            let queueProduct = new QueueProduct(model);
            let results = yield queueProduct.save();
            if (results) {
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
        const productID = req.params.productID;
        const _VID = req.params.vId;
        const storeName = req.params.storeName;
        const product = yield Product.findOne({ $and: [{ _id: ObjectId(productID) }, { "sellerData.storeName": storeName }] });
        if (!product) {
            return res.status(404).send({ success: false, statusCode: 404, error: 'Sorry! Product not found!!!' });
        }
        if (product && Array.isArray(product === null || product === void 0 ? void 0 : product.variations) && (product === null || product === void 0 ? void 0 : product.variations.length) <= 1) {
            return res.status(200).send({ success: false, statusCode: 200, message: "Please create another variation before delete this variation !" });
        }
        const result = yield Product.updateOne({ $and: [{ _id: ObjectId(productID) }, { "sellerData.storeName": storeName }] }, { $pull: { variations: { _VID } } });
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
    var _2, _3, _4, _5;
    try {
        const productID = ((_3 = (_2 = req.headers) === null || _2 === void 0 ? void 0 : _2.authorization) === null || _3 === void 0 ? void 0 : _3.split(',')[0]) || "";
        const _LID = ((_5 = (_4 = req.headers) === null || _4 === void 0 ? void 0 : _4.authorization) === null || _5 === void 0 ? void 0 : _5.split(',')[1]) || "";
        const storeName = req.params.storeName;
        //return --> "acknowledged" : true, "deletedCount" : 1
        const deletedProduct = yield Product.deleteOne({
            $and: [
                { _id: ObjectId(productID) },
                { _LID },
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
module.exports.productFlashSaleController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _6, _7, _8;
    try {
        const storeName = req.params.storeName;
        const body = req.body;
        const productID = (_6 = body === null || body === void 0 ? void 0 : body.data) === null || _6 === void 0 ? void 0 : _6.productID;
        const listingID = (_7 = body === null || body === void 0 ? void 0 : body.data) === null || _7 === void 0 ? void 0 : _7.listingID;
        const fSale = (_8 = body === null || body === void 0 ? void 0 : body.data) === null || _8 === void 0 ? void 0 : _8.fSale;
        const product = yield Product.findOne({ $and: [{ _id: ObjectId(productID) }, { _LID: listingID }, { "sellerData.storeName": storeName }] });
        if (!product) {
            return res.status(200).send({ success: false, statusCode: 200, message: "Product Not found !" });
        }
        const result = yield Product.updateOne({
            $and: [
                { _id: ObjectId(productID) }, { _LID: listingID }, { "sellerData.storeName": storeName }
            ]
        }, {
            $set: {
                isFlashSale: true,
                flashSale: fSale
            }
        }, {
            upsert: true
        });
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Flash Sale Starting...." });
        }
    }
    catch (error) {
        next(error);
    }
});
