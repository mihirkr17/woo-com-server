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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { dbh } = require("./database/db");
const cookieParser = require("cookie-parser");
// Server setup
const { ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = (0, express_1.default)();
var jwt = require("jsonwebtoken");
app.use(cors({
    origin: true,
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
}));
app.use(cookieParser());
app.use(express_1.default.json());
const port = process.env.PORT || 5000;
// verifying jwt token
const verifyJWT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // const authHeader = req.headers.authorization;
    // if (!authHeader) return res.status(403).send({ message: "Forbidden" });
    const token = req.cookies.token;
    // const token = authHeader.split(" ")[1];
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
            if (err) {
                res.clearCookie("token");
                return res.status(401).send({
                    message: err.message,
                });
            }
            req.decoded = decoded;
            next();
        });
    }
    else {
        return res.status(403).send({ message: "Forbidden" });
    }
});
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // product collection
            yield dbh.connect();
            const productsCollection = dbh.db("Products").collection("product");
            const cartCollection = dbh.db("Products").collection("cart");
            const orderCollection = dbh.db("Products").collection("orders");
            const userCollection = dbh.db("Users").collection("user");
            const productPolicy = dbh.db("Products").collection("policy");
            // // verify owner
            const verifyAuth = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                const authEmail = req.decoded.email;
                const findAuthInDB = yield userCollection.findOne({
                    email: authEmail && authEmail,
                });
                if (findAuthInDB.role === "owner" || findAuthInDB.role === "admin") {
                    next();
                }
                else {
                    res.status(403).send({ message: "Forbidden" });
                }
            });
            // verify seller
            const verifySeller = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                const authEmail = req.decoded.email;
                const findAuthInDB = yield userCollection.findOne({
                    email: authEmail && authEmail,
                });
                if (findAuthInDB.role === "seller") {
                    next();
                }
                else {
                    res.status(403).send({ message: "Forbidden" });
                }
            });
            /// privacy policy fetch
            app.get("/api/privacy-policy", (req, res) => __awaiter(this, void 0, void 0, function* () {
                res.status(200).send(yield productPolicy.findOne({}));
            }));
            /// update policy
            app.put("/api/update-policy/:policyId", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const policyId = req.params.policyId;
                const body = req.body;
                const result = yield productPolicy.updateOne({ _id: ObjectId(policyId) }, { $set: body }, { upsert: true });
                if (result) {
                    return res
                        .status(200)
                        .send({ message: "Policy updated successfully" });
                }
                else {
                    return res.status(400).send({ message: "Update failed" });
                }
            }));
            /*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            ++++++++++ Authorization api request endpoints Start ++++++++++++
            +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
            // add user to the database
            app.put("/api/sign-user", (req, res) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const authEmail = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
                const { name } = req.body;
                if (!authEmail) {
                    return res.status(400).send({ message: "Bad request" });
                }
                const token = jwt.sign({ email: authEmail }, process.env.ACCESS_TOKEN, {
                    algorithm: "HS256",
                    expiresIn: "1h",
                });
                const cookieObject = {
                    // sameSite: "none",
                    // secure: true,
                    maxAge: 3600000,
                    httpOnly: true,
                };
                if (authEmail) {
                    const existsUser = yield userCollection.findOne({ email: authEmail });
                    if (existsUser) {
                        res.cookie("token", token, cookieObject);
                        return res.status(200).send({ message: "Login success" });
                    }
                    else {
                        yield userCollection.updateOne({ email: authEmail }, { $set: { email: authEmail, displayName: name, role: "user" } }, { upsert: true });
                        res.cookie("token", token, cookieObject);
                        return res.status(200).send({ message: "Login success" });
                    }
                }
            }));
            // fetch user information from database and send to client
            app.get("/api/fetch-auth-user/", (req, res) => __awaiter(this, void 0, void 0, function* () {
                var _b;
                const authEmail = (_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1];
                if (authEmail) {
                    const result = yield userCollection.findOne({ email: authEmail });
                    return res.status(200).send({ result });
                }
                else {
                    return res.status(403).send({ message: "Forbidden. Email not found" });
                }
            }));
            app.get("/api/sign-out", (req, res) => __awaiter(this, void 0, void 0, function* () {
                res.clearCookie("token");
                res.status(200).send({ message: "Sign out successfully" });
            }));
            app.put("/api/switch-role/:role", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                var _c;
                const userEmail = req.decoded.email;
                const userID = (_c = req.headers.authorization) === null || _c === void 0 ? void 0 : _c.split(" ")[1];
                const userRole = req.params.role;
                let roleModel;
                if (!userID) {
                    return res
                        .status(400)
                        .send({ message: "Bad request! headers is missing" });
                }
                if (userRole === "user") {
                    roleModel = { role: "user" };
                }
                if (userRole === "seller") {
                    roleModel = { role: "seller" };
                }
                if (userID) {
                    const result = yield userCollection.updateOne({ _id: ObjectId(userID), email: userEmail }, { $set: roleModel }, { upsert: true });
                    if (result)
                        return res.status(200).send(result);
                }
            }));
            /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            ++++++++++ Authorization api request endpoints End ++++++++++++
            +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
            // search product api
            app.get("/api/search-products/:q", (req, res) => __awaiter(this, void 0, void 0, function* () {
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
            }));
            // fetch products by recommended
            app.get("/api/products/recommended", (req, res) => __awaiter(this, void 0, void 0, function* () {
                res
                    .status(200)
                    .send(yield productsCollection
                    .find({})
                    .sort({ rating_average: -1, top_sell: -1 })
                    .limit(6)
                    .toArray());
            }));
            // get products by some condition in manage product page api
            app.get("/api/manage-product", (req, res) => __awaiter(this, void 0, void 0, function* () {
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
            }));
            // product count
            app.get("/api/product-count", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const seller = req.query.seller;
                let result = yield productsCollection.countDocuments(seller && { seller: seller });
                res.status(200).send({ count: result });
            }));
            // Delete product from manage product page
            app.delete("/api/delete-product/:productId", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productId;
                const result = yield productsCollection.deleteOne({
                    _id: ObjectId(productId),
                });
                if (result) {
                    yield cartCollection.updateMany({ "product._id": productId }, { $pull: { product: { _id: productId } } });
                    return res
                        .status(200)
                        .send({ message: "Product deleted successfully." });
                }
                else {
                    return res.status(503).send({ message: "Service unavailable" });
                }
            }));
            // update product information
            app.put("/api/update-product/:productId", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productId;
                const body = req.body;
                let available = body === null || body === void 0 ? void 0 : body.available;
                if (available && available >= 1) {
                    body["stock"] = "in";
                }
                else {
                    body["stock"] = "out";
                }
                const exists = (yield cartCollection.find({ "product._id": productId }).toArray()) ||
                    [];
                if (exists && exists.length > 0) {
                    yield cartCollection.updateMany({ "product._id": productId }, {
                        $pull: { product: { _id: productId } },
                    });
                }
                const result = yield productsCollection.updateOne({ _id: ObjectId(productId) }, {
                    $set: body,
                }, { upsert: true });
                res
                    .status(200)
                    .send(result && { message: "Product updated successfully" });
            }));
            // update data
            app.put("/api/update-profile-data/:email", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.decoded.email;
                const result = yield userCollection.updateOne({ email: email }, { $set: req.body }, { upsert: true });
                res.status(200).send(result);
            }));
            // fetch myProfile data in my profile page
            app.get("/my-profile/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                res.status(200).send(yield userCollection.findOne({ email: email }));
            }));
            // make admin request
            app.put("/make-admin/:userId", verifyJWT, verifyAuth, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userId = req.params.userId;
                res
                    .status(200)
                    .send(yield userCollection.updateOne({ _id: ObjectId(userId) }, { $set: { role: "admin" } }, { upsert: true }));
            }));
            // demote to user request
            app.put("/api/demote-to-user/:userId", verifyJWT, verifyAuth, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userId = req.params.userId;
                res
                    .status(200)
                    .send(yield userCollection.updateOne({ _id: ObjectId(userId) }, { $set: { role: "user" } }, { upsert: true }));
            }));
            // get all user in allUser Page
            app.get("/api/manage-user", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const uType = req.query.uTyp;
                res
                    .status(200)
                    .send(yield userCollection.find({ role: uType }).toArray());
            }));
            // make seller request
            app.put("/api/make-seller-request/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                let body = req.body;
                let existSellerName;
                if (body === null || body === void 0 ? void 0 : body.seller) {
                    existSellerName = yield userCollection.findOne({
                        seller: body === null || body === void 0 ? void 0 : body.seller,
                    });
                }
                if (existSellerName) {
                    return res
                        .status(200)
                        .send({ message: "Seller name exists ! try to another" });
                }
                else {
                    const result = yield userCollection.updateOne({ email: userEmail }, {
                        $set: body,
                    }, { upsert: true });
                    res.status(200).send({ result, message: "success" });
                }
            }));
            //    api/check-seller-request
            app.get("/api/check-seller-request", (req, res) => __awaiter(this, void 0, void 0, function* () {
                res
                    .status(200)
                    .send(yield userCollection.find({ seller_request: "pending" }).toArray());
            }));
            // api/make-seller-request
            app.put("/api/permit-seller-request/:userId", verifyJWT, verifyAuth, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userId = req.params.userId;
                console.log(userId);
                const result = yield userCollection.updateOne({ _id: ObjectId(userId) }, {
                    $set: { role: "seller", seller_request: "ok", isSeller: true },
                }, { upsert: true });
                (result === null || result === void 0 ? void 0 : result.acknowledged)
                    ? res.status(200).send({ message: "Request Success" })
                    : res.status(400).send({ message: "Bad Request" });
            }));
            // inserting product into database
            app.post("/api/add-product", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const body = req.body;
                let available = body === null || body === void 0 ? void 0 : body.available;
                if (available && available >= 1) {
                    body["stock"] = "in";
                }
                else {
                    body["stock"] = "out";
                }
                res.status(200).send(yield productsCollection.insertOne(body));
            }));
            // finding all Products
            app.get("/all-products/:limits", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const totalLimits = parseInt(req.params.limits);
                const results = yield productsCollection
                    .find({})
                    .sort({ _id: -1 })
                    .limit(totalLimits)
                    .toArray();
                res.status(200).send(results);
            }));
            // Fetch single product
            // check in  cart and view product
            app.get("/api/fetch-single-product/:product_slug/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                const product_slug = req.params.product_slug;
                let inCart;
                let inWishlist;
                let result = yield productsCollection.findOne({
                    slug: product_slug,
                });
                if (result) {
                    const policy = yield productPolicy.findOne({});
                    const existProductInCart = yield cartCollection.findOne({ user_email: email, "product.slug": product_slug }, { "product.$": 1 });
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
            }));
            // fetch product by category
            app.get("/api/product-by-category", (req, res) => __awaiter(this, void 0, void 0, function* () {
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
                    findQuery = { "genre.category": productCategory };
                }
                if (productCategory && productSubCategory) {
                    findQuery = {
                        "genre.category": productCategory,
                        "genre.sub_category": productSubCategory,
                    };
                }
                if (productCategory && productSubCategory && productPostCategory) {
                    findQuery = {
                        "genre.category": productCategory,
                        "genre.sub_category": productSubCategory,
                        "genre.post_category": productPostCategory,
                    };
                }
                const tt = yield productsCollection
                    .find(findQuery, { price_fixed: { $exists: 1 } })
                    .sort(sorting)
                    .toArray();
                res.status(200).send(tt);
            }));
            // Add rating and review in products
            app.put("/api/add-product-rating/:productId", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productId;
                const email = req.decoded.email;
                const body = req.body;
                const orderId = parseInt(body === null || body === void 0 ? void 0 : body.orderId);
                yield orderCollection.updateOne({ user_email: email }, {
                    $set: {
                        "orders.$[i].isRating": true,
                    },
                }, { upsert: true, arrayFilters: [{ "i.orderId": orderId }] });
                const products = yield productsCollection.findOne({
                    _id: ObjectId(productId),
                });
                const point = parseInt(body === null || body === void 0 ? void 0 : body.rating_point);
                let ratingPoints = (products === null || products === void 0 ? void 0 : products.rating) && (products === null || products === void 0 ? void 0 : products.rating.length) > 0
                    ? products === null || products === void 0 ? void 0 : products.rating
                    : [
                        { weight: 5, count: 0 },
                        { weight: 4, count: 0 },
                        { weight: 3, count: 0 },
                        { weight: 2, count: 0 },
                        { weight: 1, count: 0 },
                    ];
                let counter = 0;
                let newRatingArray = [];
                for (let i = 0; i < ratingPoints.length; i++) {
                    let count = ratingPoints[i].count;
                    let weight = ratingPoints[i].weight;
                    if (point === weight) {
                        counter = count;
                        count += 1;
                    }
                    newRatingArray.push({ weight, count: count });
                }
                let weightVal = 0;
                let countValue = 0;
                newRatingArray &&
                    newRatingArray.length > 0 &&
                    newRatingArray.forEach((rat) => {
                        const multiWeight = parseInt(rat === null || rat === void 0 ? void 0 : rat.weight) * parseInt(rat === null || rat === void 0 ? void 0 : rat.count);
                        weightVal += multiWeight;
                        countValue += rat === null || rat === void 0 ? void 0 : rat.count;
                    });
                const ava = weightVal / countValue;
                const average = parseFloat(ava.toFixed(1));
                let filters;
                let options;
                if ((products === null || products === void 0 ? void 0 : products.rating) && (products === null || products === void 0 ? void 0 : products.rating.length) > 0) {
                    filters = {
                        $set: {
                            "rating.$[i].count": counter + 1,
                            rating_average: average,
                        },
                        $push: { reviews: body },
                    };
                    options = { upsert: true, arrayFilters: [{ "i.weight": point }] };
                }
                else {
                    filters = {
                        $set: {
                            rating: newRatingArray,
                            rating_average: average,
                        },
                        $push: { reviews: body },
                    };
                    options = { upsert: true };
                }
                const result = yield productsCollection.updateOne({ _id: ObjectId(productId) }, filters, options);
                if (result) {
                    return res.status(200).send({ message: "Thanks for your review !" });
                }
            }));
            // fetch my added product in my cart page
            app.get("/api/my-cart-items", (req, res) => __awaiter(this, void 0, void 0, function* () {
                var _d;
                const userEmail = (_d = req.headers.authorization) === null || _d === void 0 ? void 0 : _d.split(" ")[1];
                if (!userEmail) {
                    return res
                        .status(400)
                        .send({ message: "Bad request! headers missing" });
                }
                const result = yield cartCollection.findOne({ user_email: userEmail });
                if (result) {
                    const cartProduct = (result === null || result === void 0 ? void 0 : result.product) || [];
                    let cartTotalPrice = cartProduct
                        .map((p) => p === null || p === void 0 ? void 0 : p.price_total)
                        .reduce((a, b) => a + b, 0);
                    let cartTotalQuantity = cartProduct
                        .map((p) => p === null || p === void 0 ? void 0 : p.quantity)
                        .reduce((a, b) => a + b, 0);
                    let cartTotalDiscount = cartProduct
                        .map((p) => p === null || p === void 0 ? void 0 : p.discount_amount_total)
                        .reduce((a, b) => a + b, 0);
                    yield cartCollection.updateOne({ user_email: userEmail }, { $set: { cartTotalPrice, cartTotalQuantity, cartTotalDiscount } }, { $pull: { product: { stock: "out" } } }, { upsert: true });
                    res.status(200).send(result);
                }
            }));
            // update quantity of product in my-cart
            app.put("/api/update-product-quantity/:cartTypes", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                var _e, _f;
                const userEmail = req.decoded.email;
                const cart_types = req.params.cartTypes;
                const productId = req.headers.authorization;
                const { quantity } = req.body;
                let updateDocuments;
                let filters;
                if (!productId) {
                    return res
                        .status(400)
                        .send({ message: "Bad request! headers missing" });
                }
                const availableProduct = yield productsCollection.findOne({
                    _id: ObjectId(productId),
                    available: { $gte: 1 },
                    stock: "in",
                });
                if (quantity >= (availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.available) - 1) {
                    return res.status(200).send({
                        message: "Your selected quantity out of range in available product",
                    });
                }
                const cart = yield cartCollection.findOne({
                    user_email: userEmail,
                });
                if (availableProduct) {
                    if (cart_types === "buy") {
                        updateDocuments = {
                            $set: {
                                "buy_product.quantity": quantity,
                                "buy_product.price_total": parseFloat((_e = cart === null || cart === void 0 ? void 0 : cart.buy_product) === null || _e === void 0 ? void 0 : _e.price_fixed) * quantity,
                                "buy_product.discount_amount_total": parseFloat((_f = cart === null || cart === void 0 ? void 0 : cart.buy_product) === null || _f === void 0 ? void 0 : _f.discount_amount_fixed) *
                                    quantity,
                            },
                        };
                        filters = {
                            user_email: userEmail,
                        };
                    }
                    if (cart_types === "toCart") {
                        const cartProduct = (cart === null || cart === void 0 ? void 0 : cart.product) || [];
                        let price_total;
                        let discountTotal;
                        for (let i = 0; i < cartProduct.length; i++) {
                            let items = cartProduct[i];
                            if ((items === null || items === void 0 ? void 0 : items._id) === productId) {
                                price_total = (items === null || items === void 0 ? void 0 : items.price_fixed) * quantity;
                                discountTotal = (items === null || items === void 0 ? void 0 : items.discount_amount_fixed) * quantity;
                            }
                        }
                        updateDocuments = {
                            $set: {
                                "product.$.quantity": quantity,
                                "product.$.price_total": price_total,
                                "product.$.discount_amount_total": discountTotal,
                            },
                        };
                        filters = {
                            user_email: userEmail,
                            "product._id": productId,
                        };
                    }
                    const result = yield cartCollection.updateOne(filters, updateDocuments, { upsert: true });
                    return res.status(200).send(result);
                }
                else {
                    yield cartCollection.updateOne({ user_email: userEmail }, { $pull: { product: { _id: productId } } });
                    return res.status(200).send({
                        message: "This product is out of stock now and removed from your cart",
                    });
                }
            }));
            // remove item form cart with item cart id and email
            app.delete("/delete-cart-item/:cartTypes", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.headers.authorization;
                const userEmail = req.decoded.email;
                const cart_types = req.params.cartTypes;
                let updateDocuments;
                if (!productId) {
                    return res
                        .status(400)
                        .send({ message: "Bad request! headers missing" });
                }
                if (cart_types === "buy") {
                    updateDocuments = yield cartCollection.updateOne({ user_email: userEmail }, { $unset: { buy_product: "" } });
                }
                else {
                    updateDocuments = yield cartCollection.updateOne({ user_email: userEmail }, { $pull: { product: { _id: productId } } });
                }
                res
                    .status(200)
                    .send({ updateDocuments, message: `removed successfully from cart` });
            }));
            // add to wishlist
            app.put("/api/add-to-wishlist/:email", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.email;
                const verifiedEmail = req.decoded.email;
                const body = req.body;
                if (userEmail !== verifiedEmail) {
                    return res.status(403).send({ message: "Forbidden" });
                }
                const existsProduct = yield userCollection.findOne({
                    email: userEmail,
                    "wishlist._id": body === null || body === void 0 ? void 0 : body._id,
                }, {
                    "wishlist.$": 1,
                });
                if (existsProduct) {
                    return res
                        .status(200)
                        .send({ message: "Product Has Already In Your Wishlist" });
                }
                else {
                    const up = {
                        $push: { wishlist: body },
                    };
                    const wishlistRes = yield userCollection.updateOne({ email: userEmail }, up, { upsert: true });
                    res.status(200).send({
                        data: wishlistRes,
                        message: "Product Added To Your wishlist",
                    });
                }
            }));
            // remove from wishlist
            app.delete("/api/remove-to-wishlist/:productId", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productId;
                const userEmail = req.decoded.email;
                const result = yield userCollection.updateOne({ email: userEmail }, { $pull: { wishlist: { _id: productId } } });
                if (result) {
                    return res
                        .status(200)
                        .send({ message: "Product removed from your wishlist" });
                }
                else {
                    return res.status(501).send({ message: "Service unavailable" });
                }
            }));
            // inserting product into my cart api
            app.put("/api/add-to-cart", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.decoded.email;
                const body = req.body;
                const options = { upsert: true };
                const query = { user_email: email };
                const availableProduct = yield productsCollection.findOne({
                    _id: ObjectId(body === null || body === void 0 ? void 0 : body._id),
                });
                if ((availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.stock) === "in" &&
                    (availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.available) > 0) {
                    const existsProduct = yield cartCollection.findOne({
                        user_email: email,
                        "product._id": body === null || body === void 0 ? void 0 : body._id,
                    }, {
                        "product.$": 1,
                    });
                    if (existsProduct) {
                        return res
                            .status(200)
                            .send({ message: "Product Has Already In Your Cart" });
                    }
                    else {
                        const up = {
                            $push: { product: body },
                        };
                        const cartRes = yield cartCollection.updateOne(query, up, options);
                        res.status(200).send({
                            data: cartRes,
                            message: "Product Successfully Added To Your Cart",
                        });
                    }
                }
            }));
            // buy single product
            app.put("/api/add-buy-product", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.decoded.email;
                const body = req.body;
                const cartRes = yield cartCollection.updateOne({ user_email: userEmail }, { $set: { buy_product: body } }, { upsert: true });
                res.status(200).send(cartRes);
            }));
            // inserting address in cart
            app.post("/api/add-cart-address", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.decoded.email;
                const body = req.body;
                const result = yield cartCollection.updateOne({ user_email: userEmail }, { $push: { address: body } }, { upsert: true });
                res.send(result);
            }));
            // order address add api
            app.put("/api/update-cart-address", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.decoded.email;
                const body = req.body;
                const result = yield cartCollection.updateOne({ user_email: userEmail }, {
                    $set: {
                        "address.$[i]": body,
                    },
                }, { arrayFilters: [{ "i.addressId": body === null || body === void 0 ? void 0 : body.addressId }] });
                res.send(result);
            }));
            // update select_address in address to confirm for order api
            app.put("/api/select-address", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.decoded.email;
                const { addressId, select_address } = req.body;
                const addr = yield cartCollection.findOne({ user_email: userEmail });
                if (addr) {
                    const addressArr = addr === null || addr === void 0 ? void 0 : addr.address;
                    if (addressArr && addressArr.length > 0) {
                        yield cartCollection.updateOne({ user_email: userEmail }, {
                            $set: {
                                "address.$[j].select_address": false,
                            },
                        }, {
                            arrayFilters: [{ "j.addressId": { $ne: addressId } }],
                            multi: true,
                        });
                    }
                }
                let result = yield cartCollection.updateOne({ user_email: userEmail }, {
                    $set: {
                        "address.$[i].select_address": select_address,
                    },
                }, { arrayFilters: [{ "i.addressId": addressId }] });
                res.status(200).send(result);
            }));
            // delete or remove address from cart
            app.delete("/api/delete-cart-address/:addressId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.decoded.email;
                const addressId = parseInt(req.params.addressId);
                const result = yield cartCollection.updateOne({ user_email: email }, { $pull: { address: { addressId } } });
                if (result)
                    return res.send(result);
            }));
            /*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
              This is order section api operation
            +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            +++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
            // set order api call
            app.post("/set-order/:userEmail", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const verifiedEmail = req.decoded.email;
                const body = req.body;
                if (userEmail !== verifiedEmail)
                    return res.status(401).send({ message: "Unauthorized access" });
                if (!body) {
                    res.send({
                        message: "Order Cancelled. You Have To Select At least One Product",
                    });
                }
                else {
                    const result = yield orderCollection.updateOne({ user_email: userEmail }, { $push: { orders: body } }, { upsert: true });
                    res.status(200).send(result && { message: "Order success" });
                }
            }));
            // get my order list in my-order page
            app.get("/my-order/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                res.send(yield orderCollection.findOne({ user_email: email }));
            }));
            // cancel orders from admin
            app.delete("/api/remove-order/:orderId", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.decoded.email;
                const id = parseInt(req.params.orderId);
                const result = yield orderCollection.updateOne({ user_email: email }, { $pull: { orders: { orderId: id } } });
                res.status(200).send({ result, message: "Order Removed successfully" });
            }));
            // cancel my orders
            app.put("/api/cancel-my-order/:userEmail/:orderId", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const orderId = parseInt(req.params.orderId);
                const { status, cancel_reason, time_canceled } = req.body;
                const result = yield orderCollection.updateOne({ user_email: userEmail }, {
                    $set: {
                        "orders.$[i].status": status,
                        "orders.$[i].cancel_reason": cancel_reason,
                        "orders.$[i].time_canceled": time_canceled,
                    },
                }, { arrayFilters: [{ "i.orderId": orderId }] });
                res.send({ result, message: "Order canceled successfully" });
            }));
            // update order status by admin or product owner
            app.put("/update-order-status/:status/:id", verifyJWT, verifySeller, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const orderId = parseInt(req.params.id);
                const status = req.params.status;
                const userEmail = req.headers.authorization;
                const { ownerCommission, totalEarn, productId, quantity, seller } = req.body;
                let time = new Date().toLocaleString();
                let upDoc;
                if (status === "placed") {
                    upDoc = {
                        $set: {
                            "orders.$[i].status": status,
                            "orders.$[i].time_placed": time,
                        },
                    };
                }
                else if (status === "shipped") {
                    upDoc = {
                        $set: {
                            "orders.$[i].status": status,
                            "orders.$[i].time_shipped": time,
                        },
                    };
                    if (ownerCommission && totalEarn) {
                        const ownerCol = yield userCollection.findOne({ role: "owner" });
                        const sellerColumn = yield userCollection.findOne({
                            seller: seller,
                        });
                        if (ownerCol) {
                            let total_earn = (ownerCol === null || ownerCol === void 0 ? void 0 : ownerCol.total_earn) || 0;
                            let totalEr = parseFloat(ownerCommission);
                            total_earn = parseFloat(total_earn) + totalEr;
                            yield userCollection.updateOne({ role: "owner" }, { $set: { total_earn } }, { upsert: true });
                        }
                        if (sellerColumn) {
                            let total_earn = (sellerColumn === null || sellerColumn === void 0 ? void 0 : sellerColumn.total_earn) || 0;
                            let totalEr = parseFloat(totalEarn);
                            total_earn = parseFloat(total_earn) + totalEr;
                            let success_sell = (sellerColumn === null || sellerColumn === void 0 ? void 0 : sellerColumn.success_sell) || 0;
                            success_sell = success_sell + parseInt(quantity);
                            yield userCollection.updateOne({ seller }, { $set: { total_earn, success_sell } }, { upsert: true });
                        }
                    }
                    if (productId) {
                        let product = yield productsCollection.findOne({
                            _id: ObjectId(productId),
                        });
                        let available = parseInt(product === null || product === void 0 ? void 0 : product.available) - parseInt(quantity);
                        let top_sell = (parseInt(product === null || product === void 0 ? void 0 : product.top_sell) || 0) + parseInt(quantity);
                        let stock;
                        if (available >= 1) {
                            stock = "in";
                        }
                        else {
                            stock = "out";
                        }
                        yield productsCollection.updateOne({ _id: ObjectId(productId) }, { $set: { available, stock, top_sell } }, { upsert: true });
                        const cartProduct = (yield cartCollection
                            .find({ "product._id": productId })
                            .toArray()) || [];
                        if (cartProduct.length > 0) {
                            yield cartCollection.updateMany({ "product._id": productId }, {
                                $set: {
                                    "product.$.stock": stock,
                                    "product.$.available": available,
                                },
                            }, { upsert: true });
                        }
                    }
                }
                const result = yield orderCollection.updateOne({ user_email: userEmail }, upDoc, { arrayFilters: [{ "i.orderId": orderId }] });
                res.send(result);
            }));
            // dispatch order from seller
            app.put("/api/dispatch-order-request/:orderId/:userEmail", verifyJWT, verifySeller, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const orderId = parseInt(req.params.orderId);
                const userEmail = req.params.userEmail;
                res.status(200).send((yield orderCollection.updateOne({ user_email: userEmail }, {
                    $set: {
                        "orders.$[i].dispatch": true,
                    },
                }, { arrayFilters: [{ "i.orderId": orderId }] })) && { message: "Successfully order dispatched" });
            }));
            // get order list
            app.get("/api/checkout/:cartId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const cartId = req.params.cartId;
                const result = yield cartCollection.findOne({ _id: ObjectId(cartId) });
                res.send(result);
            }));
            /// find orderId
            app.get("/manage-orders", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const seller = req.query.seller;
                let result;
                if (seller) {
                    result = yield orderCollection
                        .aggregate([
                        { $unwind: "$orders" },
                        {
                            $match: {
                                $and: [
                                    { "orders.dispatch": true },
                                    { "orders.seller": seller },
                                ],
                            },
                        },
                    ])
                        .toArray();
                }
                res.status(200).send(result);
            }));
            // fetch top selling product in my dashboard
            app.get("/api/fetch-top-selling-product", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const seller = req.query.seller;
                let result;
                if (seller) {
                    result = yield productsCollection
                        .find({ seller: seller })
                        .sort({ top_sell: -1 })
                        .limit(6)
                        .toArray();
                }
                else {
                    result = yield productsCollection
                        .find({})
                        .sort({ top_sell: -1 })
                        .limit(6)
                        .toArray();
                }
                res.status(200).send(result);
            }));
        }
        finally {
        }
    });
}
run();
app.get("/", (req, res) => {
    res.status(200).send("Woo-Com Server is running");
});
app.listen(port, () => {
    console.log(`Running port is ${port}`);
});
