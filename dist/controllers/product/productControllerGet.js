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
const { productCounter, topSellingProducts, topRatedProducts } = require("../../model/product.model");
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
        // Product Details
        let productDetail = yield db.collection('products').aggregate([
            { $match: { _id: ObjectId(productId) } },
            {
                $project: {
                    variations: '$variations', swatch: "$variations",
                    brand: 1, categories: 1,
                    seller: 1, rating: 1, ratingAverage: 1, save_as: 1, createdAt: 1, bodyInfo: 1, manufacturer: 1,
                    _lId: 1
                }
            },
            { $unwind: { path: '$variations' } },
            { $match: { 'variations.vId': variationId } }
        ]).toArray();
        productDetail = productDetail[0];
        let newProduct = productDetail === null || productDetail === void 0 ? void 0 : productDetail.swatch;
        let swatches = [];
        for (let i = 0; i < newProduct.length; i++) {
            let e = newProduct[i];
            swatches.push({
                vId: e.vId,
                slug: e.slug,
                attr: e.attributes
            });
        }
        productDetail.swatch = swatches;
        // Related products
        const relatedProducts = yield db.collection("products").aggregate([
            { $unwind: { path: '$variations' } },
            {
                $match: {
                    $and: [
                        { categories: { $in: productDetail.categories } },
                        { 'variations.vId': { $ne: variationId } },
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
                        vId: "$variations.vId",
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
        // If user email address exists
        if (email) {
            const existProductInCart = yield db
                .collection("shoppingCarts")
                .findOne({ $and: [{ customerEmail: email }, { vId: variationId }] });
            const existProductInWishlist = yield db
                .collection("users")
                .findOne({ $and: [{ email }, { "wishlist.slug": product_slug }] });
            if (existProductInWishlist) {
                inWishlist = true;
            }
            if (existProductInCart && typeof existProductInCart === "object") {
                inCart = true;
            }
            productDetail["inCart"] = inCart;
            productDetail["inWishlist"] = inWishlist;
        }
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
        const seller = req.query.seller;
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
                    $match: { 'variations.vId': variationId }
                }
            ]).toArray();
            product = product[0];
        }
        else {
            product = yield db.collection("products").findOne({
                $and: [{ _id: ObjectId(productId) }, { "seller.name": seller }],
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
        const db = yield dbConnection();
        const totalLimits = parseInt(req.params.limits);
        let allProducts = yield db.collection('products').aggregate([
            { $unwind: { path: '$variations' } },
            { $match: { 'variations.status': 'active' } },
            { $sort: { 'variations.vId': -1 } },
            { $limit: totalLimits }
        ]).toArray();
        const topSellingProduct = yield topSellingProducts();
        const topRatedProduct = yield topRatedProducts();
        return allProducts
            ? res.status(200).send({
                success: true, statusCode: 200, data: {
                    store: allProducts,
                    topSellingProducts: topSellingProduct,
                    topRatedProducts: topRatedProduct
                }
            })
            : res.status(500).send({ success: false, statusCode: 500, error: "Something went wrong" });
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
        if ((user === null || user === void 0 ? void 0 : user.role) === 'seller') {
            matches = { $match: { $and: [{ 'seller.name': user === null || user === void 0 ? void 0 : user.username }, { 'stockInfo.sold': { $exists: true } }] } };
        }
        if ((user === null || user === void 0 ? void 0 : user.role) === "admin") {
            topSellers = yield db.collection('users').aggregate([
                { $match: { role: "seller" } },
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
        let showFor;
        if (isSeller.role === "seller") {
            showFor = [
                { "seller.name": isSeller === null || isSeller === void 0 ? void 0 : isSeller.username },
                { status: "active" },
                { save_as: "fulfilled" },
            ];
        }
        else {
            showFor = [{ status: "active" }, { save_as: "fulfilled" }];
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
                    { status: "active" },
                    { save_as: "fulfilled" },
                ],
            };
        };
        page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;
        cursor =
            searchText && searchText.length > 0
                ? db.collection("products").find(searchQuery(searchText))
                : filters && filters !== "all"
                    ? db.collection("products").find(filterQuery(filters))
                    : db.collection("products").find({ $and: showFor });
        if (item || page) {
            products = yield cursor
                .skip(page * parseInt(item))
                .limit(parseInt(item))
                .toArray();
        }
        else {
            products = yield cursor.toArray();
        }
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
        }
        return res.status(200).send({
            success: true,
            statusCode: 200,
            data: { products: products, draftProducts },
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
            filterQuery["seller"] = seller;
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
