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
const { topSellingProducts, topRatedProducts, allProducts } = require("../../model/common.model");
const User = require("../../model/user.model");
const Product = require("../../model/product.model");
const ShoppingCart = require("../../model/shoppingCart.model");
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
        let areaType = "";
        // If user email address exists
        if (email && typeof email === 'string') {
            existProductInCart = yield ShoppingCart.findOne({ $and: [{ customerEmail: email }, { variationID: variationID }] });
            let defaultShippingAddress = yield User.aggregate([
                { $match: { email } },
                { $unwind: { path: "$buyer.shippingAddress" } },
                { $replaceRoot: { newRoot: "$buyer.shippingAddress" } },
                {
                    $match: { default_shipping_address: true }
                }
            ]);
            defaultShippingAddress = defaultShippingAddress[0];
            areaType = defaultShippingAddress === null || defaultShippingAddress === void 0 ? void 0 : defaultShippingAddress.area_type;
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
                    deliveryCharge: {
                        $cond: { if: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge", else: "$shipping.delivery.zonalCharge" }
                    },
                    deliveryDetails: 1,
                    specification: '$specification',
                    brand: 1, categories: 1,
                    sellerData: 1, rating: 1, ratingAverage: 1, save_as: 1, createdAt: 1, bodyInfo: 1, manufacturer: 1,
                    _LID: 1,
                    paymentInfo: 1,
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
module.exports.purchaseProductController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    try {
        const authEmail = req.decoded.email;
        const role = req.decoded.role;
        const body = req.body;
        let result = yield User.findOne({
            $and: [{ email: authEmail }, { role: role }, { accountStatus: 'active' }]
        }, {
            password: 0, createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
        });
        let areaType = (Array.isArray((_b = result === null || result === void 0 ? void 0 : result.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress) &&
            ((_c = result === null || result === void 0 ? void 0 : result.buyer) === null || _c === void 0 ? void 0 : _c.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
        areaType = areaType === null || areaType === void 0 ? void 0 : areaType.area_type;
        let buyProduct = yield Product.aggregate([
            { $match: { _LID: body === null || body === void 0 ? void 0 : body.listingID } },
            { $unwind: { path: "$variations" } },
            { $match: { $and: [{ 'variations._VID': body === null || body === void 0 ? void 0 : body.variationID }] } },
            {
                $project: {
                    _id: 0,
                    title: 1,
                    slug: 1,
                    variations: 1,
                    brand: 1,
                    image: { $first: "$variations.images" },
                    sku: "$variations.sku",
                    sellerData: 1,
                    shippingCharge: {
                        $switch: {
                            branches: [
                                { case: { $eq: [areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                                { case: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                            ],
                            default: "$shipping.delivery.zonalCharge"
                        }
                    },
                    totalAmount: {
                        $add: [{ $multiply: ['$variations.pricing.sellingPrice', body === null || body === void 0 ? void 0 : body.quantity] }, {
                                $switch: {
                                    branches: [
                                        { case: { $eq: [areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                                        { case: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                                    ],
                                    default: "$shipping.delivery.zonalCharge"
                                }
                            }]
                    },
                    paymentInfo: 1,
                    sellingPrice: "$variations.pricing.sellingPrice",
                    variant: "$variations.variant",
                    stock: "$variations.stock"
                }
            }, {
                $unset: ["variations"]
            }
        ]);
        if (buyProduct && typeof buyProduct !== 'undefined') {
            buyProduct = buyProduct[0];
            buyProduct["quantity"] = body === null || body === void 0 ? void 0 : body.quantity;
            buyProduct["productID"] = body.productID;
            buyProduct["listingID"] = body === null || body === void 0 ? void 0 : body.listingID;
            buyProduct["variationID"] = body === null || body === void 0 ? void 0 : body.variationID;
            buyProduct["customerEmail"] = body === null || body === void 0 ? void 0 : body.customerEmail;
            const totalAmounts = (buyProduct === null || buyProduct === void 0 ? void 0 : buyProduct.totalAmount) && parseFloat(buyProduct === null || buyProduct === void 0 ? void 0 : buyProduct.totalAmount).toFixed(2);
            const totalQuantities = (buyProduct === null || buyProduct === void 0 ? void 0 : buyProduct.quantity) && parseInt(buyProduct === null || buyProduct === void 0 ? void 0 : buyProduct.quantity);
            const shippingFees = (buyProduct === null || buyProduct === void 0 ? void 0 : buyProduct.shippingCharge) && parseFloat(buyProduct === null || buyProduct === void 0 ? void 0 : buyProduct.shippingCharge).toFixed(2);
            const finalAmounts = buyProduct && (parseFloat(buyProduct === null || buyProduct === void 0 ? void 0 : buyProduct.totalAmount) + parseFloat(buyProduct === null || buyProduct === void 0 ? void 0 : buyProduct.shippingCharge)).toFixed(2);
            let buyingCartData = {
                product: buyProduct,
                container_p: {
                    totalAmounts,
                    totalQuantities,
                    finalAmounts,
                    shippingFees,
                },
                numberOfProducts: buyProduct.length || 0
            };
            return res.status(200).send({ success: true, statusCode: 200, data: { module: buyingCartData } });
        }
    }
    catch (error) {
        next(error);
    }
});
