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
const { productCounter, topSellingProducts, topRatedProducts, allProducts } = require("../../model/product.model");
/**
 * @controller      --> Fetch the single product information in product details page.
 * @required        --> [req.headers.authorization:email, req.query:productId, req.query:variationId, req.params:product slug]
 * @request_method  --> GET
 */
module.exports.fetchSingleProductController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const db = yield dbConnection();
        const email = req.headers.authorization || '';
        const product_slug = req.params.product_slug;
        const productId = (_a = req.query) === null || _a === void 0 ? void 0 : _a.pId;
        const variationId = req.query.vId;
        let inCart = false;
        let inWishlist = false;
        let existProductInCart = null;
        let existProductInWishlist;
        // If user email address exists
        if (email) {
            existProductInCart = yield db
                .collection("shoppingCarts")
                .findOne({ $and: [{ customerEmail: email }, { variationId: variationId }] });
            existProductInWishlist = yield db
                .collection("users")
                .findOne({ $and: [{ email }, { "wishlist.slug": product_slug }] });
        }
        // Product Details
        let productDetail = yield db.collection('products').aggregate([
            { $match: { _id: ObjectId(productId) } },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    variations: 1,
                    swatch: {
                        $map: {
                            input: "$variations",
                            as: "variation",
                            in: { variant: "$$variation.variant", _vId: "$$variation._vId" }
                        }
                    },
                    fulfilledBy: "$shipping.fulfilledBy",
                    deliveryCharge: "$shipping.delivery",
                    deliveryDetails: 1,
                    specification: '$specification',
                    brand: 1, categories: 1,
                    seller: 1, rating: 1, ratingAverage: 1, save_as: 1, createdAt: 1, bodyInfo: 1, manufacturer: 1,
                    _lId: 1,
                    inCart: {
                        $cond: {
                            if: { $eq: [existProductInCart, null] }, then: false, else: true
                        }
                    }
                }
            },
            { $unwind: { path: '$variations' } },
            { $match: { 'variations._vId': variationId } }
        ]).toArray();
        productDetail = productDetail[0];
        // Related products
        const relatedProducts = yield db.collection("products").aggregate([
            { $unwind: { path: '$variations' } },
            {
                $match: {
                    $and: [
                        { categories: { $in: productDetail.categories } },
                        { 'variations._vId': { $ne: variationId } },
                        { 'variations.status': "active" },
                    ],
                },
            },
            {
                $project: {
                    _lId: 1,
                    ratingAverage: "$ratingAverage",
                    brand: "$brand",
                    variations: {
                        _vId: "$variations._vId",
                        pricing: "$variations.pricing",
                        title: "$variations.title",
                        slug: "$variations.slug",
                        attributes: "$variations.attributes",
                        images: "$variations.images"
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
        return res.status(500).send({ success: false, statusCode: 500, error: error.message });
    }
});
/**
 * @controller      --> productsByCategoryController
 * @required        --> categories [Optional -> filters query]
 */
module.exports.productsByCategoryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            sorting
        ]).toArray();
        //   .find({
        //   $and: [
        //     { categories: { $all: category } },
        //     { status: "active" },
        //     { save_as: "fulfilled" },
        //   ],
        // })
        // .sort(sorting)
        // .toArray()) || [];
        return products
            ? res.status(200).send(products)
            : res.status(404).send({
                success: false,
                statusCode: 404,
                error: "Products not available.",
            });
    }
    catch (error) {
        return res
            .status(500)
            .send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
/**
* @controller      --> Fetch the single product in product edit page.
* @required        --> [req.query:seller, req.query:productId, req.query:variationId]
* @request_method  --> GET
*/
module.exports.fetchSingleProductByPidController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const productId = req.query.pid;
        const variationId = req.query.vId;
        const storeName = req.query.storeName;
        let product;
        if (variationId) {
            product = yield db.collection('products').aggregate([
                {
                    $match: { $and: [{ _id: ObjectId(productId) }, { save_as: "draft" }] }
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
        return res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.searchProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const q = req.params.q;
        const result = (yield db
            .collection("products")
            .aggregate([
            {
                $match: {
                    $and: [{ status: "active" }, { save_as: "fulfilled" }],
                    $or: [
                        { title: { $regex: q, $options: "i" } },
                        { "seller.name": { $regex: q, $options: "i" } },
                        { brand: { $regex: q, $options: "i" } },
                        { categories: { $in: [q] } },
                    ],
                },
            },
            {
                $project: {
                    title: "$title",
                    categories: "$categories",
                    images: "$images",
                },
            },
        ])
            .toArray()) || [];
        return result.length > 0
            ? res.status(200).send(result)
            : res.status(204).send();
    }
    catch (error) {
        res
            .status(500)
            .send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
/**
 * @apiName --> count products
 * @required --> Optional (If count by seller then pass the seller query on url)
 */
module.exports.countProductsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const seller = req.query.seller;
        let result;
        if (seller) {
            result = yield productCounter(seller);
        }
        else {
            result = yield productCounter();
        }
        res.status(200).send({ success: true, statusCode: 200, count: result });
    }
    catch (error) {
        console.log(error === null || error === void 0 ? void 0 : error.message);
        res
            .status(500)
            .send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
/**
 * @controller      --> Home store controller.
 * @required        --> []
 * @request_method  --> GET
 */
module.exports.homeStoreController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        return res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
// Dashboard Overview Controller
module.exports.dashboardOverviewController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const authEmail = req.decoded.email;
        const role = req.decoded.role;
        let topSellers;
        let topSoldProducts;
        let matches;
        const user = yield db.collection("users").findOne({ $and: [{ email: authEmail }, { role }] });
        if ((user === null || user === void 0 ? void 0 : user.role) === 'SELLER') {
            matches = { $match: { $and: [{ 'seller.name': user === null || user === void 0 ? void 0 : user.username }, { 'stockInfo.sold': { $exists: true } }] } };
        }
        if ((user === null || user === void 0 ? void 0 : user.role) === 'ADMIN') {
            topSellers = yield db.collection('users').aggregate([
                { $match: { role: 'SELLER' } },
                {
                    $project: {
                        totalSell: '$inventoryInfo.totalSell',
                        username: '$username',
                        email: '$email',
                        totalProducts: '$inventoryInfo.totalProducts',
                    }
                },
                { $sort: { totalSell: -1 } },
                { $limit: 10 }
            ]).toArray();
            matches = { $match: { 'stockInfo.sold': { $exists: true } } };
        }
        topSoldProducts = yield db.collection('products').aggregate([
            matches,
            {
                $project: {
                    sold: '$stockInfo.sold',
                    images: '$images',
                    title: '$title',
                    seller: '$seller.name',
                    sku: '$sku',
                    brand: '$brand',
                    categories: '$categories',
                    pricing: '$pricing'
                }
            },
            { $sort: { sold: -1 } },
            { $limit: 10 }
        ]).toArray();
        return res.status(200).send({ success: true, statusCode: 200, data: { topSellers, topSoldProducts } });
    }
    catch (error) {
        return res
            .status(500)
            .send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.manageProductController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const authEmail = req.decoded.email;
        const role = req.decoded.role;
        const isSeller = yield db
            .collection("users")
            .findOne({ $and: [{ email: authEmail }, { role }] });
        let item;
        let page;
        item = req.query.items;
        page = req.query.page;
        let searchText = req.query.search;
        let filters = req.query.category;
        let cursor;
        let products;
        let draftProducts;
        let inactiveProduct;
        let showFor;
        if (isSeller.role === 'SELLER') {
            showFor = [
                { "seller.name": isSeller === null || isSeller === void 0 ? void 0 : isSeller.username },
                { 'variations.status': "active" },
                { save_as: "fulfilled" },
            ];
        }
        else {
            showFor = [{ 'variations.status': "active" }, { save_as: "fulfilled" }];
        }
        const searchQuery = (sTxt) => {
            item = "";
            page = "";
            return {
                $and: showFor,
                $or: [
                    { title: { $regex: sTxt, $options: "i" } },
                    { "seller.name": { $regex: sTxt, $options: "i" } },
                ],
            };
        };
        const filterQuery = (category) => {
            item = "";
            page = "";
            return {
                $and: [
                    { categories: { $all: [category] } },
                    { 'variations.status': "active" },
                    { save_as: "fulfilled" },
                ],
            };
        };
        page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;
        // cursor =
        //    searchText && searchText.length > 0
        //       ? db.collection("products").find(searchQuery(searchText))
        //       : filters && filters !== "all"
        //          ? db.collection("products").find(filterQuery(filters))
        //          : db.collection("products").find({ $and: showFor });
        // if (item || page) {
        //    products = await cursor
        //       .skip(page * parseInt(item))
        //       .limit(parseInt(item))
        //       .toArray();
        // } else {
        //    products = await cursor.toArray();
        // }
        products = yield db.collection("products").aggregate([
            { $unwind: { path: '$variations' } },
            {
                $match: {
                    $and: showFor,
                    $or: [
                        { title: { $regex: searchText, $options: "i" } },
                        { "seller.name": { $regex: searchText, $options: "i" } },
                        { categories: { $all: [filters] } }
                    ]
                }
            },
            {
                $skip: page * parseInt(item)
            }, {
                $limit: (parseInt(item))
            }
        ]).toArray();
        if (isSeller) {
            // draftProducts = await db.collection('products').aggregate([
            //   {
            //     $match: { $and: [{ "seller.name": isSeller?.username }, { save_as: "draft" }] }
            //   },
            //   {
            //     $unwind: { path: "$variations" },
            //   }
            // ]).toArray();
            draftProducts = yield db
                .collection("products")
                .find({
                $and: [{ "seller.name": isSeller === null || isSeller === void 0 ? void 0 : isSeller.username }, { save_as: "draft" }],
            })
                .toArray();
            inactiveProduct = yield db.collection("products").aggregate([
                { $unwind: { path: "$variations" } },
                { $match: { $and: [{ "seller.name": isSeller === null || isSeller === void 0 ? void 0 : isSeller.username }, { "variations.status": 'inactive' }] } }
            ]).toArray();
        }
        return res.status(200).send({
            success: true,
            statusCode: 200,
            data: { products, draftProducts, inactiveProduct },
        });
    }
    catch (error) {
        return res
            .status(500)
            .send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
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
