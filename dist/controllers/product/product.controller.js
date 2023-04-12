"use strict";
// product.controller.tsx
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
const Product = require("../../model/product.model");
const { findUserByEmail, getSellerInformationByID, actualSellingPrice, newPricing, basicProductProject, calculateShippingCost } = require("../../services/common.service");
/**
 * @controller      --> Fetch the single product information in product details page.
 * @required        --> [req.headers.authorization:email, req.query:productID, req.query:variationID, req.params:product slug]
 * @request_method  --> GET
 */
module.exports.fetchSingleProductController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const productID = (_a = req.query) === null || _a === void 0 ? void 0 : _a.pId;
        const variationID = (_b = req.query) === null || _b === void 0 ? void 0 : _b.vId;
        // Product Details
        let productDetail = yield Product.aggregate([
            { $match: { _id: ObjectId(productID) } },
            {
                $addFields: {
                    swatch: {
                        $map: {
                            input: {
                                $filter: {
                                    input: "$variations",
                                    cond: {
                                        $eq: ["$$v.status", "active"]
                                    },
                                    as: "v"
                                }
                            },
                            as: "variation",
                            in: { variant: "$$variation.variant", _vrid: "$$variation._vrid" }
                        }
                    }
                }
            },
            { $unwind: { path: '$variations' } },
            { $match: { 'variations._vrid': variationID } },
            {
                $project: {
                    title: '$variations.vTitle',
                    slug: 1,
                    variations: 1,
                    swatch: 1,
                    fulfilledBy: "$shipping.fulfilledBy",
                    specification: 1,
                    brand: 1, categories: 1,
                    sellerData: 1,
                    images: 1,
                    rating: 1,
                    ratingAverage: 1,
                    save_as: 1,
                    createdAt: 1,
                    bodyInfo: 1,
                    description: 1,
                    manufacturer: 1,
                    pricing: newPricing,
                    isFreeShipping: "$shipping.isFree",
                    volumetricWeight: "$packaged.volumetricWeight",
                    _lid: 1
                }
            }
        ]);
        productDetail = productDetail[0];
        if ((_c = productDetail === null || productDetail === void 0 ? void 0 : productDetail.sellerData) === null || _c === void 0 ? void 0 : _c.sellerID) {
            productDetail["sellerInfo"] = yield getSellerInformationByID((_d = productDetail === null || productDetail === void 0 ? void 0 : productDetail.sellerData) === null || _d === void 0 ? void 0 : _d.sellerID);
        }
        // Related products
        const relatedProducts = yield Product.aggregate([
            { $unwind: { path: '$variations' } },
            {
                $match: {
                    $and: [
                        { categories: { $in: productDetail.categories } },
                        { "variations._vrid": { $ne: variationID } },
                        { "variations.status": "active" },
                    ],
                },
            },
            { $project: basicProductProject },
            { $limit: 5 },
        ]);
        return res.status(200).send({
            success: true,
            statusCode: 200,
            data: { product: productDetail, relatedProducts },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @controller      --> productsByCategoryController
 * @required        --> categories [Optional -> filters query]
 */
module.exports.productsByCategoryController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categories, filters } = req.query;
        let category = (categories && categories.toString().split(",")) || [];
        let sorting = {};
        if (filters && filters === "lowest") {
            sorting = { $sort: { "variations.pricing.sellingPrice": 1 } };
        }
        else if (filters && filters === "highest") {
            sorting = { $sort: { "variations.pricing.sellingPrice": -1 } };
        }
        else {
            sorting = { $sort: { "variations.modifiedAt": 1 } };
        }
        const products = yield Product.aggregate([
            {
                $addFields: {
                    variations: {
                        $slice: [{
                                $filter: {
                                    input: "$variations",
                                    cond: { $and: [{ $eq: ["$$v.status", 'active'] }, { $eq: ["$$v.stock", "in"] }] },
                                    as: "v"
                                }
                            }, 1]
                    },
                }
            },
            { $unwind: { path: '$variations' } },
            {
                $match: {
                    $and: [
                        { categories: { $all: category } },
                        { 'variations.status': "active" }
                    ]
                }
            },
            {
                $project: basicProductProject
            },
            sorting
        ]);
        return products
            ? res.status(200).send(products)
            : res.status(404).send({
                success: false,
                statusCode: 404,
                error: "Products not available.",
            });
    }
    catch (error) {
        next(error);
    }
});
module.exports.searchProducts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = req.params.q;
        if (!q || q === "") {
            return res.status(200).send([]);
        }
        const result = (yield Product.aggregate([
            { $unwind: { path: "$variations" } },
            {
                $match: {
                    $and: [{ 'variations.status': "active" }, { save_as: "fulfilled" }],
                    $or: [
                        { title: { $regex: q, $options: "i" } },
                        { "sellerData.storeName": { $regex: q, $options: "i" } },
                        { brand: { $regex: q, $options: "i" } },
                        { categories: { $in: [q] } },
                    ],
                },
            },
            {
                $project: {
                    title: "$variations.vTitle",
                    categories: 1,
                    _vrid: "$variations._vrid",
                    image: { $first: "$images" },
                    slug: 1,
                    _lid: 1
                },
            },
        ])) || [];
        return result && res.status(200).send(result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * @controller      --> Home store controller.
 * @required        --> []
 * @request_method  --> GET
 */
module.exports.homeStoreController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalLimits = parseInt(req.params.limits);
        const products = yield Product.aggregate([
            { $match: { save_as: 'fulfilled' } },
            {
                $addFields: {
                    variations: {
                        $slice: [{
                                $filter: {
                                    input: "$variations",
                                    cond: { $eq: ["$$v.status", 'active'] },
                                    as: "v"
                                }
                            }, 1]
                    },
                }
            },
            { $unwind: { path: "$variations" } },
            { $project: basicProductProject },
            { $sort: { "variations._vrid": -1 } },
            { $limit: totalLimits }
        ]);
        const topSellingProduct = yield Product.aggregate([
            { $unwind: { path: '$variations' } },
            { $match: { 'variations.status': "active" } },
            { $sort: { 'variations.totalSold': -1 } },
            { $limit: 6 }
        ]);
        const topRatedProduct = yield Product.aggregate([
            { $addFields: { variations: { $first: "$variations" } } },
            { $match: { 'variations.status': 'active' } },
            { $project: basicProductProject },
            { $sort: { ratingAverage: -1 } },
            { $limit: 6 }
        ]);
        return res.status(200).send({
            success: true, statusCode: 200, data: {
                store: products,
                topSellingProducts: topSellingProduct,
                topRatedProducts: topRatedProduct
            }
        });
    }
    catch (error) {
        next(error);
    }
});
module.exports.fetchTopSellingProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const seller = req.query.seller;
        let filterQuery = {
            status: "active",
        };
        if (seller) {
            filterQuery['SELLER'] = seller;
        }
        const result = yield Product.find(filterQuery).sort({ "stockInfo.sold": -1 }).limit(6).toArray();
        return res.status(200).send(result);
    }
    catch (error) {
        next(error);
    }
});
module.exports.purchaseProductController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g, _h, _j;
    try {
        const authEmail = req.decoded.email;
        const body = req.body;
        let user = yield findUserByEmail(authEmail);
        let defaultShippingAddress = (Array.isArray((_e = user === null || user === void 0 ? void 0 : user.buyer) === null || _e === void 0 ? void 0 : _e.shippingAddress) &&
            ((_f = user === null || user === void 0 ? void 0 : user.buyer) === null || _f === void 0 ? void 0 : _f.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
        let areaType = defaultShippingAddress === null || defaultShippingAddress === void 0 ? void 0 : defaultShippingAddress.area_type;
        let product = yield Product.aggregate([
            { $match: { _lid: body === null || body === void 0 ? void 0 : body.listingID } },
            { $unwind: { path: "$variations" } },
            { $match: { $and: [{ 'variations._vrid': body === null || body === void 0 ? void 0 : body.variationID }, { 'variations.stock': "in" }, { 'variations.status': "active" }] } },
            {
                $project: {
                    _id: 0,
                    title: "$variations.vTitle",
                    slug: 1,
                    variations: 1,
                    brand: 1,
                    packaged: 1,
                    image: { $first: "$images" },
                    sku: "$variations.sku",
                    sellerData: 1,
                    shipping: 1,
                    savingAmount: { $multiply: [{ $subtract: ["$pricing.price", actualSellingPrice] }, parseInt(body === null || body === void 0 ? void 0 : body.quantity)] },
                    baseAmount: { $multiply: [actualSellingPrice, body === null || body === void 0 ? void 0 : body.quantity] },
                    sellingPrice: actualSellingPrice,
                    variant: "$variations.variant",
                    available: "$variations.available",
                    stock: "$variations.stock"
                }
            }, {
                $unset: ["variations"]
            }
        ]);
        if (product && typeof product !== 'undefined') {
            product = product[0];
            product["quantity"] = body === null || body === void 0 ? void 0 : body.quantity;
            product["productID"] = body.productID;
            product["listingID"] = body === null || body === void 0 ? void 0 : body.listingID;
            product["variationID"] = body === null || body === void 0 ? void 0 : body.variationID;
            product["customerEmail"] = body === null || body === void 0 ? void 0 : body.customerEmail;
            if (((_g = product === null || product === void 0 ? void 0 : product.shipping) === null || _g === void 0 ? void 0 : _g.isFree) && ((_h = product === null || product === void 0 ? void 0 : product.shipping) === null || _h === void 0 ? void 0 : _h.isFree)) {
                product["shippingCharge"] = 0;
            }
            else {
                product["shippingCharge"] = calculateShippingCost((_j = product === null || product === void 0 ? void 0 : product.packaged) === null || _j === void 0 ? void 0 : _j.volumetricWeight, areaType);
            }
            const baseAmounts = (product === null || product === void 0 ? void 0 : product.baseAmount) && parseInt(product === null || product === void 0 ? void 0 : product.baseAmount);
            const totalQuantities = (product === null || product === void 0 ? void 0 : product.quantity) && parseInt(product === null || product === void 0 ? void 0 : product.quantity);
            const shippingFees = (product === null || product === void 0 ? void 0 : product.shippingCharge) && parseInt(product === null || product === void 0 ? void 0 : product.shippingCharge);
            const finalAmounts = product && (parseInt(product === null || product === void 0 ? void 0 : product.baseAmount) + (product === null || product === void 0 ? void 0 : product.shippingCharge));
            const savingAmounts = product && (parseInt(product === null || product === void 0 ? void 0 : product.savingAmount));
            let buyingCartData = {
                product: product,
                container_p: {
                    baseAmounts,
                    totalQuantities,
                    finalAmounts,
                    shippingFees,
                    savingAmounts
                },
                numberOfProducts: product.length || 0
            };
            return res.status(200).send({ success: true, statusCode: 200, data: { module: buyingCartData } });
        }
    }
    catch (error) {
        next(error);
    }
});
