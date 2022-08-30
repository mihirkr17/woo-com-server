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
const { dbh } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const { productModel, productUpdateModel } = require("../../model/product");
module.exports.searchProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        const q = req.params.q;
        const searchQuery = (sTxt) => {
            let findProduct = {
                $or: [
                    { title: { $regex: sTxt, $options: "i" } },
                    { seller: { $regex: sTxt, $options: "i" } },
                    { brand: { $regex: sTxt, $options: "i" } },
                    { "genre.category": { $regex: sTxt, $options: "i" } },
                ],
            };
            return findProduct;
        };
        const result = yield productsCollection.find(searchQuery(q)).toArray();
        res.status(200).send(result);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.topRatedProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        res
            .status(200)
            .send(yield productsCollection
            .find({ status: "active" })
            .sort({ rating_average: -1 })
            .limit(6)
            .toArray());
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.topSellingProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        res
            .status(200)
            .send(yield productsCollection
            .find({ status: "active" })
            .sort({ top_sell: -1 })
            .limit(6)
            .toArray());
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.countProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        const seller = req.query.seller;
        let result = yield productsCollection.countDocuments(seller && { seller: seller });
        res.status(200).send({ count: result });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.deleteProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        const userCollection = dbh.db("Users").collection("user");
        const productId = req.params.productId;
        const result = yield productsCollection.deleteOne({
            _id: ObjectId(productId),
        });
        if (result) {
            yield userCollection.updateMany({ "myCartProduct._id": productId }, { $pull: { myCartProduct: { _id: productId } } });
            return res.status(200).send({ message: "Product deleted successfully." });
        }
        else {
            return res.status(503).send({ message: "Service unavailable" });
        }
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        const userCollection = dbh.db("Users").collection("user");
        const productId = req.params.productId;
        const body = req.body;
        const model = productUpdateModel(body);
        const exists = (yield userCollection
            .find({ "myCartProduct._id": productId })
            .toArray()) || [];
        if (exists && exists.length > 0) {
            yield userCollection.updateMany({ "myCartProduct._id": productId }, {
                $pull: { myCartProduct: { _id: productId } },
            });
        }
        const result = yield productsCollection.updateOne({ _id: ObjectId(productId) }, { $set: model }, { upsert: true });
        res.status(200).send(result && { message: "Product updated successfully" });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.updateStock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        const productId = req.headers.authorization;
        const body = req.body;
        let stock = (body === null || body === void 0 ? void 0 : body.available) <= 1 ? "out" : "in";
        if (productId && body) {
            const result = yield productsCollection.updateOne({ _id: ObjectId(productId) }, { $set: { available: body === null || body === void 0 ? void 0 : body.available, stock } }, { upsert: true });
            res.status(200).send(result);
        }
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.addProductHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        const model = productModel(body);
        yield productsCollection.insertOne(model);
        res.status(200).send({ message: "Product added successfully" });
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
module.exports.allProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        const totalLimits = parseInt(req.params.limits);
        const results = yield productsCollection
            .find({ status: "active" })
            .sort({ _id: -1 })
            .limit(totalLimits)
            .toArray();
        res.status(200).send(results);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
module.exports.fetchSingleProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        const productPolicy = dbh.db("Products").collection("policy");
        const userCollection = dbh.db("Users").collection("user");
        const email = req.params.email;
        const product_slug = req.params.product_slug;
        let inCart;
        let inWishlist;
        let result = yield productsCollection.findOne({
            slug: product_slug,
            status: "active",
        });
        if (result) {
            const policy = yield productPolicy.findOne({});
            const existProductInCart = yield userCollection.findOne({ email: email, "myCartProduct.slug": product_slug }, { "myCartProduct.$": 1 });
            const existProductInWishlist = yield userCollection.findOne({ email: email, "wishlist.slug": product_slug }, { "wishlist.$": 1 });
            if (existProductInWishlist) {
                inWishlist = true;
            }
            else {
                inWishlist = false;
            }
            yield productsCollection.createIndex({ slug: 1 });
            if (existProductInCart) {
                inCart = true;
            }
            else {
                inCart = false;
            }
            result["inCart"] = inCart;
            result["policy"] = policy;
            result["inWishlist"] = inWishlist;
            res.status(200).send(result);
        }
        else {
            return res.status(404).send({ message: "Not Found" });
        }
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
module.exports.fetchSingleProductByPid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        const productId = req.query.pid;
        const seller = req.query.seller;
        return res.status(200).send(yield productsCollection.findOne({
            _id: ObjectId(productId),
            seller: seller,
        }));
    }
    catch (error) {
        return res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.productByCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        let findQuery;
        const productCategory = req.query.category;
        const productSubCategory = req.query.sb_category;
        const productPostCategory = req.query.pt_category;
        const filters = req.query.filters;
        let sorting;
        if (filters) {
            if (filters === "lowest") {
                sorting = { price_fixed: 1 };
            }
            else if (filters === "highest") {
                sorting = { price_fixed: -1 };
            }
            else {
                sorting = {};
            }
        }
        if (productCategory) {
            findQuery = {
                "genre.category": productCategory,
                status: "active",
            };
        }
        if (productCategory && productSubCategory) {
            findQuery = {
                "genre.category": productCategory,
                "genre.sub_category": productSubCategory,
                status: "active",
            };
        }
        if (productCategory && productSubCategory && productPostCategory) {
            findQuery = {
                "genre.category": productCategory,
                "genre.sub_category": productSubCategory,
                "genre.post_category": productPostCategory,
                status: "active",
            };
        }
        const tt = yield productsCollection
            .find(findQuery, { price_fixed: { $exists: 1 } })
            .sort(sorting)
            .toArray();
        res.status(200).send(tt);
    }
    catch (error) {
        return res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.fetchTopSellingProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        const seller = req.query.seller;
        let filterQuery = {
            status: "active",
        };
        if (seller) {
            filterQuery["seller"] = seller;
        }
        const result = yield productsCollection
            .find(filterQuery)
            .sort({ top_sell: -1 })
            .limit(6)
            .toArray();
        res.status(200).send(result);
    }
    catch (error) {
        return res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.manageProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield dbh.connect();
    const productsCollection = dbh.db("Products").collection("product");
    let item;
    let page;
    let seller_name = req.query.seller;
    item = req.query.items;
    page = req.query.page;
    let searchText = req.query.search;
    let filters = req.query.category;
    let cursor;
    let result;
    const searchQuery = (sTxt, seller_name = "") => {
        item = "";
        page = "";
        let findProduct = {
            $or: [
                { title: { $regex: sTxt, $options: "i" } },
                { seller: { $regex: sTxt, $options: "i" } },
            ],
        };
        if (seller_name) {
            findProduct["seller"] = seller_name;
        }
        return findProduct;
    };
    const filterQuery = (category, seller_name = "") => {
        item = "";
        page = "";
        let findProduct = {
            "genre.category": category,
        };
        if (seller_name) {
            findProduct["seller"] = seller_name;
        }
        return findProduct;
    };
    page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;
    try {
        cursor =
            searchText && searchText.length > 0
                ? productsCollection.find(searchQuery(searchText, seller_name || ""))
                : filters && filters !== "all"
                    ? productsCollection.find(filterQuery(filters, seller_name || ""))
                    : productsCollection.find((seller_name && { seller: seller_name }) || {});
        if (item || page) {
            result = yield cursor
                .skip(page * parseInt(item))
                .limit(parseInt(item))
                .toArray();
        }
        else {
            result = yield cursor.toArray();
        }
        res.status(200).send(result);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
