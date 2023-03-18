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
const { product_variation_template_engine } = require("../../templates/product.template");
// Controllers
module.exports.updateStockController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const productID = req.headers.authorization || "";
        const body = req.body;
        const storeName = req.params.storeName;
        if (!((_a = body === null || body === void 0 ? void 0 : body.variations) === null || _a === void 0 ? void 0 : _a._vrid) || !((_b = body === null || body === void 0 ? void 0 : body.variations) === null || _b === void 0 ? void 0 : _b.available)) {
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
                arrayFilters: [{ "i._vrid": (_e = body === null || body === void 0 ? void 0 : body.variations) === null || _e === void 0 ? void 0 : _e._vrid }]
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
module.exports.variationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const formTypes = req.query.formType || "";
        const requestFor = req.query.requestFor;
        let result;
        const body = req.body;
        if (!formTypes || formTypes === "")
            throw new Error("Required form type !");
        if (!body)
            throw new Error("Required body !");
        const { request } = body;
        if (!(request === null || request === void 0 ? void 0 : request.productID))
            throw new Error("Required product id !");
        if (!request)
            throw new Error("Required body !");
        let model = product_variation_template_engine(request === null || request === void 0 ? void 0 : request.variations);
        const productID = request === null || request === void 0 ? void 0 : request.productID;
        const variationID = (request === null || request === void 0 ? void 0 : request.variationID) || "";
        // Update variation
        if (formTypes === 'update-variation' && requestFor === 'product_variations') {
            model['_vrid'] = variationID;
            if (variationID && variationID !== "") {
                result = yield Product.findOneAndUpdate({ _id: ObjectId(productID) }, { $set: { 'variations.$[i]': model } }, { arrayFilters: [{ "i._vrid": variationID }] });
            }
        }
        // create new variation
        if (formTypes === 'new-variation') {
            let newVariationID = "vi_" + Math.random().toString(36).toLowerCase().slice(2, 18);
            model['_vrid'] = newVariationID;
            result = yield Product.findOneAndUpdate({ _id: ObjectId(productID) }, { $push: { variations: model } }, { upsert: true });
        }
        return result ? res.status(200).send({ success: true, statusCode: 200, message: "Data Saved" })
            : res.status(500).send({ success: false, statusCode: 500, message: "Server error !" });
    }
    catch (error) {
        next(error);
    }
});
module.exports.productControlController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h, _j, _k, _l, _m, _o, _p;
    try {
        const body = req.body;
        let result;
        if ((body === null || body === void 0 ? void 0 : body.market_place) !== 'woo-kart') {
            return res.status(403).send({ success: false, statusCode: 403, error: "Forbidden." });
        }
        if ((_f = body === null || body === void 0 ? void 0 : body.data) === null || _f === void 0 ? void 0 : _f.vId) {
            result = yield Product.findOneAndUpdate({
                $and: [
                    { _id: ObjectId((_g = body === null || body === void 0 ? void 0 : body.data) === null || _g === void 0 ? void 0 : _g.pId) },
                    { _lid: (_h = body === null || body === void 0 ? void 0 : body.data) === null || _h === void 0 ? void 0 : _h.lId },
                    { save_as: 'fulfilled' }
                ]
            }, { $set: { 'variations.$[i].status': (_j = body === null || body === void 0 ? void 0 : body.data) === null || _j === void 0 ? void 0 : _j.action } }, { arrayFilters: [{ "i._vrid": (_k = body === null || body === void 0 ? void 0 : body.data) === null || _k === void 0 ? void 0 : _k.vId }] });
        }
        else {
            result = yield Product.findOneAndUpdate({
                $and: [
                    { _id: ObjectId((_l = body === null || body === void 0 ? void 0 : body.data) === null || _l === void 0 ? void 0 : _l.pId) },
                    { _lid: (_m = body === null || body === void 0 ? void 0 : body.data) === null || _m === void 0 ? void 0 : _m.lId }
                ]
            }, { $set: { save_as: (_o = body === null || body === void 0 ? void 0 : body.data) === null || _o === void 0 ? void 0 : _o.action, "variations.$[].status": "inactive" } }, { upsert: true, multi: true });
        }
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: `Request ${(_p = body === null || body === void 0 ? void 0 : body.data) === null || _p === void 0 ? void 0 : _p.action} successful.` });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.viewAllProductsInDashboard = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _q, _r, _s, _t, _u, _v;
    try {
        // await db.collection("products").createIndex({ _lid: 1, slug: 1, save_as: 1, categories: 1, brand: 1, "sellerData.storeName": 1, "sellerData.sellerName": 1, "sellerData.sellerID": 1 });
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
                { "sellerData.storeName": (_r = (_q = user === null || user === void 0 ? void 0 : user.seller) === null || _q === void 0 ? void 0 : _q.storeInfos) === null || _r === void 0 ? void 0 : _r.storeName },
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
                $project: {
                    title: 1, slug: 1, categories: 1, pricing: 1,
                    images: 1, variations: 1, brand: 1, _lid: 1,
                    package: 1,
                    save_as: 1,
                    shipping: 1,
                    bodyInfo: 1,
                    specification: 1,
                    description: 1,
                    manufacturer: 1,
                    sellerData: 1,
                    totalVariation: { $cond: { if: { $isArray: "$variations" }, then: { $size: "$variations" }, else: 0 } }
                }
            },
            {
                $skip: page * parseInt(item)
            }, {
                $limit: (parseInt(item))
            }
        ]);
        draftProducts = yield Product.aggregate([
            {
                $match: {
                    $and: [{ save_as: "draft" }, { "sellerData.storeName": (_t = (_s = user === null || user === void 0 ? void 0 : user.seller) === null || _s === void 0 ? void 0 : _s.storeInfos) === null || _t === void 0 ? void 0 : _t.storeName }]
                }
            },
            {
                $project: {
                    title: 1, slug: 1, categories: 1, pricing: 1,
                    images: 1, variations: 1, brand: 1, _lid: 1,
                    package: 1,
                    save_as: 1,
                    shipping: 1,
                    bodyInfo: 1,
                    specification: 1,
                    description: 1,
                    manufacturer: 1,
                    sellerData: 1,
                    totalVariation: { $cond: { if: { $isArray: "$variations" }, then: { $size: "$variations" }, else: 0 } }
                }
            },
            {
                $skip: page * parseInt(item)
            }, {
                $limit: (parseInt(item))
            }
        ]);
        inactiveProduct = yield Product.aggregate([
            { $unwind: { path: "$variations" } },
            {
                $match: {
                    $and: [
                        { save_as: 'fulfilled' },
                        (user === null || user === void 0 ? void 0 : user.role) === 'SELLER' && { "sellerData.storeName": (_v = (_u = user === null || user === void 0 ? void 0 : user.seller) === null || _u === void 0 ? void 0 : _u.storeInfos) === null || _v === void 0 ? void 0 : _v.storeName },
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
                    $match: { 'variations._vrid': variationID }
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
    var _w, _x, _y, _z, _0;
    try {
        const authEmail = req.decoded.email;
        const formTypes = req.params.formTypes;
        const body = req.body;
        const lId = ((_w = req.headers) === null || _w === void 0 ? void 0 : _w.authorization) || null;
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
            model.sellerData.sellerID = user === null || user === void 0 ? void 0 : user._uuid;
            model.sellerData.sellerName = user === null || user === void 0 ? void 0 : user.fullName;
            model.sellerData.storeName = (_y = (_x = user === null || user === void 0 ? void 0 : user.seller) === null || _x === void 0 ? void 0 : _x.storeInfos) === null || _y === void 0 ? void 0 : _y.storeName;
            let result = yield Product.findOneAndUpdate({ _lid: lId }, { $set: model }, { upsert: true });
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
            model.sellerData.sellerID = user === null || user === void 0 ? void 0 : user._uuid;
            model.sellerData.sellerName = user === null || user === void 0 ? void 0 : user.fullName;
            model.sellerData.storeName = (_0 = (_z = user === null || user === void 0 ? void 0 : user.seller) === null || _z === void 0 ? void 0 : _z.storeInfos) === null || _0 === void 0 ? void 0 : _0.storeName;
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
        const _vrid = req.params.vId;
        const storeName = req.params.storeName;
        const product = yield Product.findOne({ $and: [{ _id: ObjectId(productID) }, { "sellerData.storeName": storeName }] });
        if (!product) {
            return res.status(404).send({ success: false, statusCode: 404, error: 'Sorry! Product not found!!!' });
        }
        if (product && Array.isArray(product === null || product === void 0 ? void 0 : product.variations) && (product === null || product === void 0 ? void 0 : product.variations.length) <= 1) {
            return res.status(200).send({ success: false, statusCode: 200, message: "Please create another variation before delete this variation !" });
        }
        const result = yield Product.updateOne({ $and: [{ _id: ObjectId(productID) }, { "sellerData.storeName": storeName }] }, { $pull: { variations: { _vrid } } });
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
    var _1, _2, _3, _4;
    try {
        const productID = ((_2 = (_1 = req.headers) === null || _1 === void 0 ? void 0 : _1.authorization) === null || _2 === void 0 ? void 0 : _2.split(',')[0]) || "";
        const _lid = ((_4 = (_3 = req.headers) === null || _3 === void 0 ? void 0 : _3.authorization) === null || _4 === void 0 ? void 0 : _4.split(',')[1]) || "";
        const storeName = req.params.storeName;
        //return --> "acknowledged" : true, "deletedCount" : 1
        const deletedProduct = yield Product.deleteOne({
            $and: [
                { _id: ObjectId(productID) },
                { _lid },
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
    var _5, _6, _7;
    try {
        const storeName = req.params.storeName;
        const body = req.body;
        const productID = (_5 = body === null || body === void 0 ? void 0 : body.data) === null || _5 === void 0 ? void 0 : _5.productID;
        const listingID = (_6 = body === null || body === void 0 ? void 0 : body.data) === null || _6 === void 0 ? void 0 : _6.listingID;
        const fSale = (_7 = body === null || body === void 0 ? void 0 : body.data) === null || _7 === void 0 ? void 0 : _7.fSale;
        const product = yield Product.findOne({ $and: [{ _id: ObjectId(productID) }, { _lid: listingID }, { "sellerData.storeName": storeName }] });
        if (!product) {
            return res.status(200).send({ success: false, statusCode: 200, message: "Product Not found !" });
        }
        const result = yield Product.updateOne({
            $and: [
                { _id: ObjectId(productID) }, { _lid: listingID }, { "sellerData.storeName": storeName }
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
module.exports.updateProductData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const urlParams = req.params.paramsType;
        let setFilter;
        if (!body)
            throw new Error("Required body !");
        const { listingID, productID, actionType, pricing, shipping, packageInfo, manufacturer } = body;
        if (!productID)
            throw new Error("Required product ID !");
        if (!listingID)
            throw new Error("Required listing ID !");
        if (!actionType)
            throw new Error("Required actionType !");
        if (actionType === "PRICING" && urlParams === "pricing") {
            if (!pricing)
                throw new Error("Required pricing !");
            const { price, sellingPrice } = pricing;
            let discount = 0;
            if (!price && price === "")
                throw new Error("Required price identifier !");
            if (!sellingPrice && sellingPrice === "")
                throw new Error("Required selling price identifier !");
            discount = (parseInt(price) - parseInt(sellingPrice)) / parseInt(price);
            discount = discount * 100;
            discount = parseInt(discount);
            setFilter = {
                $set: {
                    "pricing.price": parseInt(price),
                    "pricing.sellingPrice": parseInt(sellingPrice),
                    "pricing.discount": discount
                }
            };
        }
        if (actionType === "SHIPPING-INFORMATION" && urlParams === "shipping-information") {
            if (!shipping)
                throw new Error("Required shipping information !");
            const { fulfilledBy, procurementType, procurementSLA, provider } = shipping && shipping;
            if (procurementType === "" || fulfilledBy === "" || procurementSLA === "" || provider === "")
                throw new Error("Required fulfilledBy, procurementType, procurementSLA");
            setFilter = {
                $set: { shipping: shipping }
            };
        }
        if (actionType === "PACKAGE-DIMENSION" && urlParams === "package-dimension") {
            if (!packageInfo)
                throw new Error("Required package information about product");
            const { packageWeight, packageLength, packageWidth, packageHeight, inTheBox } = packageInfo && packageInfo;
            let volumetricWeight = ((parseFloat(packageHeight) * parseFloat(packageLength) * parseFloat(packageWidth)) / 5000).toFixed(1);
            volumetricWeight = parseFloat(volumetricWeight);
            let newPackage = {
                dimension: {
                    height: parseFloat(packageHeight),
                    length: parseFloat(packageLength),
                    width: parseFloat(packageWidth)
                },
                weight: parseFloat(packageWeight),
                weightUnit: 'kg',
                dimensionUnit: 'cm',
                volumetricWeight,
                inTheBox: inTheBox
            };
            setFilter = {
                $set: { package: newPackage }
            };
        }
        if (actionType === "MANUFACTURER-INFORMATION" && urlParams === "manufacturer-information") {
            if (!manufacturer || typeof manufacturer !== "object")
                throw new Error("Required manufacturer details about product !");
            const { manufacturerOrigin, manufacturerDetails } = manufacturer && manufacturer;
            setFilter = {
                $set: {
                    "manufacturer.origin": manufacturerOrigin,
                    "manufacturer.details": manufacturerDetails
                }
            };
        }
        const result = yield Product.findOneAndUpdate({ $and: [{ _lid: listingID }, { _id: ObjectId(productID) }] }, setFilter, { upsert: true });
        return result ? res.status(200).send({ success: true, statusCode: 200, message: urlParams + " updated successfully." })
            : next({ message: "Failed to updated!" });
    }
    catch (error) {
        next(error);
    }
});
