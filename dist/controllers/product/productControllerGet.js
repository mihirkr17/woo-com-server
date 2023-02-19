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
const { topSellingProducts, topRatedProducts, allProducts } = require("../../model/product.model");
/**
 * @controller      --> Fetch the single product information in product details page.
 * @required        --> [req.headers.authorization:email, req.query:productID, req.query:variationID, req.params:product slug]
 * @request_method  --> GET
 */
module.exports.fetchSingleProductController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const db = yield dbConnection();
        const email = req.headers.authorization || '';
        const product_slug = req.params.product_slug;
        const productID = (_a = req.query) === null || _a === void 0 ? void 0 : _a.pId;
        const variationID = req.query.vId;
        let existProductInCart = null;
        let existProductInWishlist;
        // If user email address exists
        if (email && typeof email === 'string') {
            existProductInCart = yield db
                .collection("shoppingCarts")
                .findOne({ $and: [{ customerEmail: email }, { variationID: variationID }] });
            existProductInWishlist = yield db
                .collection("users")
                .findOne({ $and: [{ email }, { "wishlist.slug": product_slug }] });
        }
        // Product Details
        let productDetail = yield db.collection('products').aggregate([
            { $match: { _id: ObjectId(productID) } },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    variations: 1,
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
                            in: { variant: "$$variation.variant", _VID: "$$variation._VID" }
                        }
                    },
                    fulfilledBy: "$shipping.fulfilledBy",
                    deliveryCharge: "$shipping.delivery",
                    deliveryDetails: 1,
                    specification: '$specification',
                    brand: 1, categories: 1,
                    sellerData: 1, rating: 1, ratingAverage: 1, save_as: 1, createdAt: 1, bodyInfo: 1, manufacturer: 1,
                    _LID: 1,
                    inCart: {
                        $cond: {
                            if: { $eq: [existProductInCart, null] }, then: false, else: true
                        }
                    }
                }
            },
            { $unwind: { path: '$variations' } },
            { $match: { 'variations._VID': variationID } }
        ]).toArray();
        productDetail = productDetail[0];
        // Related products
        const relatedProducts = yield db.collection("products").aggregate([
            { $unwind: { path: '$variations' } },
            {
                $match: {
                    $and: [
                        { categories: { $in: productDetail.categories } },
                        { 'variations._VID': { $ne: variationID } },
                        { 'variations.status': "active" },
                    ],
                },
            },
            {
                $project: {
                    _LID: 1,
                    title: 1,
                    slug: 1,
                    ratingAverage: "$ratingAverage",
                    brand: "$brand",
                    variations: {
                        _VID: "$variations._VID",
                        pricing: "$variations.pricing",
                        variant: "$variations.variant"
                    },
                    reviews: 1,
                },
            },
            { $limit: 5 },
        ]).toArray();
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
        const db = yield dbConnection();
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
        const products = yield db.collection("products").aggregate([
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
                $project: {
                    title: 1, slug: 1, variations: 1, rating: 1, brand: 1, _LID: 1, _id: 1,
                    ratingAverage: 1
                }
            },
            sorting
        ]).toArray();
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
        const db = yield dbConnection();
        const q = req.params.q;
        const result = (yield db
            .collection("products")
            .aggregate([
            { $unwind: { path: "$variations" } },
            {
                $match: {
                    $and: [{ 'variations.status': "active" }, { save_as: "fulfilled" }],
                    $or: [
                        { title: { $regex: q, $options: "i" } },
                        { "sellerData.sellerName": { $regex: q, $options: "i" } },
                        { brand: { $regex: q, $options: "i" } },
                        { categories: { $in: [q] } },
                    ],
                },
            },
            {
                $project: {
                    title: "$title",
                    categories: "$categories",
                    images: "$variations.images",
                },
            },
        ])
            .toArray()) || [];
        return result.length > 0
            ? res.status(200).send(result)
            : res.status(204).send();
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
        const products = yield allProducts(totalLimits);
        const topSellingProduct = yield topSellingProducts();
        const topRatedProduct = yield topRatedProducts();
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
module.exports.fetchTopSellingProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const seller = req.query.seller;
        let filterQuery = {
            status: "active",
        };
        if (seller) {
            filterQuery['SELLER'] = seller;
        }
        const result = yield db
            .collection("products")
            .find(filterQuery)
            .sort({ "stockInfo.sold": -1 })
            .limit(6)
            .toArray();
        res.status(200).send(result);
    }
    catch (error) {
        return res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
