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
const User = require("../../model/user.model");
const QueueProduct = require("../../model/queueProduct.model");
const Product = require("../../model/product.model");
const { Api400Error, Api500Error } = require("../../errors/apiResponse");
module.exports.productControlController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { market_place, actionType, actionFor, listingID, productID } = req === null || req === void 0 ? void 0 : req.body;
        if (market_place !== 'wooKart')
            throw new Api400Error("Permission denied !");
        if (!listingID || !productID)
            throw new Api400Error("Required product id and listing id !");
        let filters;
        if (actionFor === "status" && (["Active", "Inactive"].includes(actionType))) {
            filters = {
                $set: { status: actionType }
            };
        }
        if (!filters)
            throw new Api400Error("Required filter !");
        const result = yield Product.findOneAndUpdate({ $and: [{ _lid: listingID }, { _id: ObjectId(productID) }] }, filters, { upsert: true });
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: `Request ${actionType} success.` });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.viewAllProductsInDashboard = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
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
        if (user.role === 'SUPPLIER') {
            showFor = [
                { "supplier.storeName": (_a = user === null || user === void 0 ? void 0 : user.store) === null || _a === void 0 ? void 0 : _a.name },
                { isVerified: true }
            ];
        }
        else {
            showFor = [{ status: "Active" }];
        }
        page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;
        if (searchText) {
            filters = '';
            src = [
                { title: { $regex: searchText, $options: "i" } },
                { "supplier.storeName": { $regex: searchText, $options: "i" } },
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
                    title: 1, slug: 1,
                    categories: 1,
                    pricing: 1,
                    variations: 1,
                    brand: 1,
                    _lid: 1,
                    packaged: 1,
                    status: 1,
                    shipping: 1,
                    keywords: 1,
                    metaDescription: 1,
                    specification: 1,
                    description: 1,
                    manufacturer: 1,
                    options: 1,
                    supplier: 1,
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
                    $and: [{ status: "Inactive" }, { "supplier.storeName": (_b = user === null || user === void 0 ? void 0 : user.store) === null || _b === void 0 ? void 0 : _b.name }]
                }
            },
            {
                $project: {
                    title: 1, slug: 1,
                    categories: 1, pricing: 1,
                    images: 1, variations: 1, brand: 1, _lid: 1,
                    packaged: 1,
                    status: 1,
                    shipping: 1,
                    keywords: 1,
                    metaDescription: 1,
                    options: 1,
                    specification: 1,
                    description: 1,
                    manufacturer: 1,
                    supplier: 1,
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
                        (user === null || user === void 0 ? void 0 : user.role) === 'SUPPLIER' && { "supplier.storeName": (_c = user === null || user === void 0 ? void 0 : user.store) === null || _c === void 0 ? void 0 : _c.name },
                        { status: 'Inactive' }
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
* @required        --> [req.query:seller, req.query:productID, req.query:sku]
* @request_method  --> GET
*/
module.exports.getProductForSellerDSBController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productID = req.query.pid;
        const sku = req.query.sku;
        const storeName = req.query.storeName;
        let product;
        if (!storeName && typeof storeName === 'undefined' && !productID)
            return res.status(204).send();
        if (sku && typeof sku === 'string') {
            product = yield Product.aggregate([
                {
                    $match: { _id: ObjectId(productID) }
                },
                {
                    $unwind: { path: "$variations" },
                },
                {
                    $match: { 'variations.sku': sku }
                }
            ]);
            product = product[0];
        }
        else {
            product = yield Product.findOne({
                $and: [{ _id: ObjectId(productID) }, { "supplier.storeName": storeName }],
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
module.exports.productFlashSaleController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f;
    try {
        const storeName = req.params.storeName;
        const body = req.body;
        const productID = (_d = body === null || body === void 0 ? void 0 : body.data) === null || _d === void 0 ? void 0 : _d.productID;
        const listingID = (_e = body === null || body === void 0 ? void 0 : body.data) === null || _e === void 0 ? void 0 : _e.listingID;
        const fSale = (_f = body === null || body === void 0 ? void 0 : body.data) === null || _f === void 0 ? void 0 : _f.fSale;
        const product = yield Product.findOne({ $and: [{ _id: ObjectId(productID) }, { _lid: listingID }, { "supplier.storeName": storeName }] });
        if (!product) {
            return res.status(200).send({ success: false, statusCode: 200, message: "Product Not found !" });
        }
        const result = yield Product.updateOne({
            $and: [
                { _id: ObjectId(productID) }, { _lid: listingID }, { "supplier.storeName": storeName }
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
module.exports.queueProductsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { storeName } = req.params;
        const { email } = req.decoded;
        if (!storeName)
            throw new Api400Error("Required store name as a parameter !");
        const queueProduct = (yield QueueProduct.find({ $and: [{ "supplier.email": email }, { "supplier.storeName": storeName }] })) || [];
        let countQueue = queueProduct.length || 0;
        if (!Array.isArray(queueProduct))
            throw new Api400Error("Queue is empty !");
        return res.status(200).send({ success: true, statusCode: 200, data: { queue: queueProduct, countQueue } });
    }
    catch (error) {
        next(error);
    }
});
