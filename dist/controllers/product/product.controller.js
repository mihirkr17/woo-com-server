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
const { dbh, dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const { productModel, productUpdateModel } = require("../../model/product");
module.exports.searchProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
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
        const result = yield db.collection("products").find(searchQuery(q)).toArray();
        res.status(200).send(result);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.topRatedProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        res
            .status(200)
            .send(yield db.collection("products")
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
        const db = yield dbConnection();
        res
            .status(200)
            .send(yield db.collection("products")
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
        const db = yield dbConnection();
        const seller = req.query.seller;
        let result = yield db.collection("products").countDocuments(seller && { seller: seller });
        res.status(200).send({ count: result });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.deleteProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const productId = req.params.productId;
        const result = yield db.collection("products").deleteOne({
            _id: ObjectId(productId),
        });
        if (result) {
            yield db.collection("users").updateMany({ "myCartProduct._id": productId }, { $pull: { myCartProduct: { _id: productId } } });
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
        const db = yield dbConnection();
        const productId = req.params.productId;
        const body = req.body;
        const model = productUpdateModel(body);
        const exists = (yield db.collection("users")
            .find({ "myCartProduct._id": productId })
            .toArray()) || [];
        if (exists && exists.length > 0) {
            yield db.collection("users").updateMany({ "myCartProduct._id": productId }, {
                $pull: { myCartProduct: { _id: productId } },
            });
        }
        const result = yield db.collection("products").updateOne({ _id: ObjectId(productId) }, { $set: model }, { upsert: true });
        res.status(200).send(result && { message: "Product updated successfully" });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.updateStock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const productId = req.headers.authorization;
        const body = req.body;
        let stock = (body === null || body === void 0 ? void 0 : body.available) <= 1 ? "out" : "in";
        if (productId && body) {
            const result = yield db.collection("products").updateOne({ _id: ObjectId(productId) }, { $set: { available: body === null || body === void 0 ? void 0 : body.available, stock } }, { upsert: true });
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
        const db = yield dbConnection();
        const model = productModel(body);
        yield db.collection("products").insertOne(model);
        res.status(200).send({ message: "Product added successfully" });
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
module.exports.allProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const totalLimits = parseInt(req.params.limits);
        const result = yield db.collection("products")
            .find({ status: "active" })
            .sort({ _id: -1 })
            .limit(totalLimits)
            .toArray();
        return result
            ? res.status(200).send(result)
            : res.status(500).send({ success: false, error: "Something went wrong" });
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
module.exports.fetchSingleProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const email = req.query.email;
        const product_slug = req.params.product_slug;
        let inCart;
        let inWishlist;
        yield db.collection("products").createIndex({ slug: 1, status: 1 });
        let result = yield db.collection("products").findOne({
            slug: product_slug,
            status: "active",
        });
        if (!result) {
            return res
                .status(400)
                .send({ success: false, error: "Product not found!" });
        }
        if (email) {
            const existProductInCart = yield db.collection("users").findOne({ email: email, "myCartProduct.slug": product_slug }, { "myCartProduct.$": 1 });
            const existProductInWishlist = yield db.collection("users").findOne({ email: email, "wishlist.slug": product_slug }, { "wishlist.$": 1 });
            if (existProductInWishlist) {
                inWishlist = true;
            }
            else {
                inWishlist = false;
            }
            if (existProductInCart) {
                inCart = true;
            }
            else {
                inCart = false;
            }
            result["inCart"] = inCart;
            // result["policy"] = policy;
            result["inWishlist"] = inWishlist;
        }
        return res.status(200).send(result);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
module.exports.fetchSingleProductByPid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const productId = req.query.pid;
        const seller = req.query.seller;
        return res.status(200).send(yield db.collection("products").findOne({
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
        const db = yield dbConnection();
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
        const tt = yield db.collection("products")
            .find(findQuery, { price_fixed: { $exists: 1 } })
            .sort(sorting)
            .toArray();
        return tt
            ? res.status(200).send(tt)
            : res.status(500).send({ success: false, error: "Something went wrong" });
    }
    catch (error) {
        return res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
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
        const result = yield db.collection("products")
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
    const db = yield dbConnection();
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
                ? db.collection("products").find(searchQuery(searchText, seller_name || ""))
                : filters && filters !== "all"
                    ? db.collection("products").find(filterQuery(filters, seller_name || ""))
                    : db.collection("products").find((seller_name && { seller: seller_name }) || {});
        if (item || page) {
            result = yield cursor
                .skip(page * parseInt(item))
                .limit(parseInt(item))
                .toArray();
        }
        else {
            result = yield cursor.toArray();
        }
        return result
            ? res.status(200).send(result)
            : res.status(200).send({ success: false, error: "Something went wrong" });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
