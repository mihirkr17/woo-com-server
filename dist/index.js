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
// Server setup
const { ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = (0, express_1.default)();
var jwt = require("jsonwebtoken");
// middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
}));
app.use(express_1.default.json());
const port = process.env.PORT || 5000;
// verifying jwt token
const verifyJWT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(403).send({ message: "Forbidden" });
    const token = authHeader.split(" ")[1];
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
            if (err) {
                return res.status(401).send({
                    message: err.message
                });
            }
            req.decoded = decoded;
            next();
        });
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
            const reviewCollection = dbh.db("Products").collection("review");
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
            /*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            ++++++++++ Authorization api request endpoints Start ++++++++++++
            +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
            // add user to the database
            app.put("/api/sign-user/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
                    algorithm: "HS256",
                    expiresIn: "5m",
                });
                res.cookie('token', token, { httpOnly: true });
                const existsUser = yield userCollection.findOne({ email: email });
                if (existsUser) {
                    return res.status(200).send({ token });
                }
                else {
                    const result = yield userCollection.updateOne({ email: email }, { $set: { email, role: "user" } }, { upsert: true });
                    return res.status(200).send({ result, token });
                }
            }));
            // fetch user information from database and send to client
            app.get("/api/fetch-auth-user", verifyJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const email = req.decoded.email;
                const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
                if (token && email) {
                    const result = yield userCollection.findOne({ email: email });
                    res.status(200).send({ result });
                }
                else {
                    return res
                        .status(403)
                        .send({ message: "Forbidden. Header Is Missing" });
                }
            }));
            /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            ++++++++++ Authorization api request endpoints End ++++++++++++
            +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
            // fetch products by recommended
            app.get("/api/products/recommended", (req, res) => __awaiter(this, void 0, void 0, function* () {
                res
                    .status(200)
                    .send(yield productsCollection.find({ top_sell: { $gte: 5 } }).toArray());
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
                        category: category,
                    };
                    if (seller_name) {
                        findProduct["seller"] = seller_name;
                    }
                    return findProduct;
                };
                cursor =
                    searchText && searchText.length > 0
                        ? productsCollection.find(searchQuery(searchText, seller_name || ""))
                        : filters && filters !== "all"
                            ? productsCollection.find(filterQuery(filters, seller_name || ""))
                            : productsCollection.find((seller_name && { seller: seller_name }) || {});
                if (item || page) {
                    result = yield cursor
                        .skip(parseInt(page) * parseInt(item))
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
            app.delete("/api/delete-product/:productId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productId;
                const result = yield productsCollection.deleteOne({
                    _id: ObjectId(productId),
                });
                result
                    ? res.status(200).send({ message: "Product deleted successfully." })
                    : res.status(503).send({ message: "Service unavailable" });
            }));
            // update product information
            app.put("/api/update-product/:productId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productId;
                const body = req.body;
                let available = body === null || body === void 0 ? void 0 : body.available;
                if (available && available >= 1) {
                    body["stock"] = "in";
                }
                else {
                    body["stock"] = "out";
                }
                const result = yield productsCollection.updateOne({ _id: ObjectId(productId) }, {
                    $set: body,
                }, { upsert: true });
                res
                    .status(200)
                    .send(result && { message: "Product updated successfully" });
            }));
            // update data
            app.put("/update-profile-data/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
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
            app.post("/add-product", (req, res) => __awaiter(this, void 0, void 0, function* () {
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
            app.get("/products", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const results = yield productsCollection.find({}).toArray();
                res.send(results);
            }));
            // Finding one specific particular product
            app.get("/products/:productId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productId;
                const q = {
                    _id: ObjectId(productId),
                };
                const results = yield productsCollection.findOne(q);
                res.send(results);
            }));
            // Fetch single product
            // check in  cart and view product
            app.get("/api/fetch-single-product/:productId/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                const productId = req.params.productId;
                const filterP = yield cartCollection
                    .aggregate([
                    { $unwind: "$product" },
                    { $match: { user_email: email, "product._id": productId } },
                ])
                    .toArray();
                let result = yield productsCollection.findOne({
                    _id: ObjectId(productId),
                });
                const exist = filterP.some((f) => { var _a; return ((_a = f === null || f === void 0 ? void 0 : f.product) === null || _a === void 0 ? void 0 : _a._id) === productId; });
                let cardHandler;
                if (exist) {
                    cardHandler = true;
                }
                else {
                    cardHandler = false;
                }
                result["cardHandler"] = cardHandler;
                res.send(result);
            }));
            // fetch product by category
            app.get("/product-category/:category", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productCategory = req.params.category;
                const findP = yield productsCollection
                    .find({
                    sub_category: productCategory,
                })
                    .toArray();
                res.send(findP);
            }));
            // upsert review in product
            app.put("/add-rating/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                var _b, _c, _d, _e, _f;
                const email = req.params.email;
                const body = req.body;
                let newRating;
                const findRating = yield reviewCollection.findOne({
                    user_email: email,
                });
                if (findRating) {
                    const productArr = (findRating === null || findRating === void 0 ? void 0 : findRating.rating) ? findRating === null || findRating === void 0 ? void 0 : findRating.rating : [];
                    if (productArr.length > 0) {
                        for (let i = 0; i < productArr.length; i++) {
                            let elem = productArr[i].rating_id;
                            if (elem === (body === null || body === void 0 ? void 0 : body.rating_id)) {
                                res.send({ message: "Product Has Already In Your Cart" });
                                return;
                            }
                            else {
                                newRating = [...productArr, body];
                            }
                        }
                    }
                    else {
                        newRating = [body];
                    }
                }
                else {
                    newRating = [body];
                }
                const products = yield productsCollection.findOne({
                    _id: ObjectId(body === null || body === void 0 ? void 0 : body.product_id),
                });
                const point = parseInt(body === null || body === void 0 ? void 0 : body.rating_point);
                let newRatingPoint = products === null || products === void 0 ? void 0 : products.rating;
                let rat1 = parseInt((_b = newRatingPoint[4]) === null || _b === void 0 ? void 0 : _b.count) || 0;
                let rat2 = parseInt((_c = newRatingPoint[3]) === null || _c === void 0 ? void 0 : _c.count) || 0;
                let rat3 = parseInt((_d = newRatingPoint[2]) === null || _d === void 0 ? void 0 : _d.count) || 0;
                let rat4 = parseInt((_e = newRatingPoint[1]) === null || _e === void 0 ? void 0 : _e.count) || 0;
                let rat5 = parseInt((_f = newRatingPoint[0]) === null || _f === void 0 ? void 0 : _f.count) || 0;
                if (point === 5) {
                    rat5 += 1;
                }
                else if (point === 4) {
                    rat4 += 1;
                }
                else if (point === 3) {
                    rat3 += 1;
                }
                else if (point === 2) {
                    rat2 += 1;
                }
                else {
                    rat1 += 1;
                }
                let ratingArr = [
                    { weight: 5, count: rat5 },
                    { weight: 4, count: rat4 },
                    { weight: 3, count: rat3 },
                    { weight: 2, count: rat2 },
                    { weight: 1, count: rat1 },
                ];
                yield productsCollection.updateOne({ _id: ObjectId(body === null || body === void 0 ? void 0 : body.product_id) }, { $set: { rating: ratingArr } }, { upsert: true });
                const result = yield reviewCollection.updateOne({ user_email: email }, { $set: { rating: newRating } }, { upsert: true });
                res.send(result);
            }));
            // my review
            app.get("/my-review/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                const result = yield reviewCollection
                    .aggregate([{ $unwind: "$rating" }, { $match: { user_email: email } }])
                    .toArray();
                res.send(result);
            }));
            // product review fetch
            app.get("/product-review/:productId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productId;
                const result = yield reviewCollection
                    .aggregate([
                    { $unwind: "$rating" },
                    { $match: { "rating.product_id": productId } },
                ])
                    .toArray();
                res.send(result);
            }));
            // fetch my added product in my cart page
            app.get("/my-cart-items/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const result = yield cartCollection.findOne({ user_email: userEmail });
                if (result) {
                    yield cartCollection.updateOne({ user_email: userEmail }, { $pull: { product: { stock: "out" } } });
                }
                res.status(200).send(result);
            }));
            // update quantity of product in my-cart
            app.put("/api/update-product-quantity/:productId/:email/:cartTypes", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productId;
                const userEmail = req.params.email;
                const cart_types = req.params.cartTypes;
                const { quantity, price_total, discount_amount_total } = req.body;
                let updateDocuments;
                let filters;
                if (cart_types === "buy") {
                    updateDocuments = {
                        $set: {
                            "buy_product.quantity": quantity,
                            "buy_product.price_total": price_total,
                            "buy_product.discount_amount_total": discount_amount_total,
                        },
                    };
                    filters = {
                        user_email: userEmail,
                    };
                }
                else {
                    updateDocuments = {
                        $set: {
                            "product.$.quantity": quantity,
                            "product.$.price_total": price_total,
                            "product.$.discount_amount_total": discount_amount_total,
                        },
                    };
                    filters = {
                        user_email: userEmail,
                        "product._id": productId,
                    };
                }
                const result = yield cartCollection.updateOne(filters, updateDocuments, { upsert: true });
                res.status(200).send(result);
            }));
            // remove item form cart with item cart id and email
            app.delete("/delete-cart-item/:productId/:email/:cartTypes", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productId;
                const userEmail = req.params.email;
                const cart_types = req.params.cartTypes;
                let updateDocuments;
                if (cart_types === "buy") {
                    updateDocuments = yield cartCollection.updateOne({ user_email: userEmail }, { $set: { buy_product: {} } });
                }
                else {
                    updateDocuments = yield cartCollection.updateOne({ user_email: userEmail }, { $pull: { product: { _id: productId } } });
                }
                res
                    .status(200)
                    .send({ updateDocuments, message: `removed successfully from cart` });
            }));
            // inserting product into my cart api
            app.put("/api/add-to-cart/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                let newProduct;
                const email = req.params.email;
                const body = req.body;
                const options = { upsert: true };
                const query = { user_email: email };
                if ((body === null || body === void 0 ? void 0 : body.stock) === "in" && (body === null || body === void 0 ? void 0 : body.available) > 0) {
                    const existsProduct = yield cartCollection.findOne({
                        user_email: email,
                    });
                    if (existsProduct) {
                        const productArr = (existsProduct === null || existsProduct === void 0 ? void 0 : existsProduct.product)
                            ? existsProduct === null || existsProduct === void 0 ? void 0 : existsProduct.product
                            : [];
                        if (productArr.length > 0) {
                            for (let i = 0; i < productArr.length; i++) {
                                let elem = productArr[i]._id;
                                if (elem === (body === null || body === void 0 ? void 0 : body._id)) {
                                    res.send({ message: "Product Has Already In Your Cart" });
                                    return;
                                }
                                else {
                                    newProduct = [...productArr, body];
                                }
                            }
                        }
                        else {
                            newProduct = [body];
                        }
                    }
                    else {
                        newProduct = [body];
                    }
                    const up = {
                        $set: { product: newProduct },
                    };
                    const cartRes = yield cartCollection.updateOne(query, up, options);
                    res.send({
                        data: cartRes,
                        message: "Product Successfully Added To Your Cart",
                    });
                }
            }));
            // buy single product
            app.put("/api/add-buy-product/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.email;
                const body = req.body;
                const cartRes = yield cartCollection.updateOne({ user_email: userEmail }, { $set: { buy_product: body } }, { upsert: true });
                res.status(200).send(cartRes);
            }));
            // update cart items
            app.put("/api/update-cart-items/:email/:productId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productId;
                const email = req.params.email;
                const { quantity, price, discount_amount_fixed, discount_amount_total, discount, price_total, price_fixed, stock, available, modifiedAt, } = req.body;
                const result = yield cartCollection.updateOne({ user_email: email, "product._id": productId }, {
                    $set: {
                        "product.$.quantity": quantity,
                        "product.$.price": price,
                        "product.$.discount": discount,
                        "product.$.price_total": price_total,
                        "product.$.price_fixed": price_fixed,
                        "product.$.discount_amount_fixed": discount_amount_fixed,
                        "product.$.discount_amount_total": discount_amount_total,
                        "product.$.stock": stock,
                        "product.$.available": available,
                        "product.$.modifiedAt": modifiedAt,
                    },
                }, { upsert: true });
                res.status(200).send(result);
            }));
            // inserting address in cart
            app.post("/api/add-cart-address/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const body = req.body;
                const result = yield cartCollection.updateOne({ user_email: userEmail }, { $push: { address: body } }, { upsert: true });
                res.send(result);
            }));
            // order address add api
            app.put("/api/update-cart-address/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const body = req.body;
                const result = yield cartCollection.updateOne({ user_email: userEmail }, {
                    $set: {
                        "address.$[i]": body,
                    },
                }, { arrayFilters: [{ "i.addressId": body === null || body === void 0 ? void 0 : body.addressId }] });
                res.send(result);
            }));
            // update select_address in address to confirm for order api
            app.put("/api/select-address/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
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
            app.delete("/api/delete-cart-address/:email/:addressId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                const addressId = parseInt(req.params.addressId);
                const result = yield cartCollection.updateOne({ user_email: email }, { $pull: { address: { addressId } } });
                res.send(result);
            }));
            // get order address
            app.get("/cart-address/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const result = yield cartCollection.findOne({
                    user_email: userEmail,
                });
                res.send(result);
            }));
            /*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
              This is order section api operation
            +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            +++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
            // set order api call
            app.post("/set-order/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const body = req.body;
                if (!body) {
                    res.send({
                        message: "Order Cancelled. You Have To Select At least One Product",
                    });
                }
                else {
                    const result = yield orderCollection.updateOne({ user_email: userEmail }, { $push: { orders: body } }, { upsert: true });
                    res.send(result);
                }
            }));
            // get my order list in my-order page
            app.get("/my-order/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                res.send(yield orderCollection.findOne({ user_email: email }));
            }));
            // cancel orders from admin
            app.delete("/api/remove-order/:email/:orderId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                const id = parseInt(req.params.orderId);
                const result = yield orderCollection.updateOne({ user_email: email }, { $pull: { orders: { orderId: id } } });
                res.send({ result, message: "Order Removed successfully" });
            }));
            // cancel my orders
            app.put("/api/cancel-my-order/:userEmail/:orderId", (req, res) => __awaiter(this, void 0, void 0, function* () {
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
            app.put("/update-order-status/:status/:user_email/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const orderId = parseInt(req.params.id);
                const status = req.params.status;
                const userEmail = req.params.user_email;
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
                    }
                }
                const result = yield orderCollection.updateOne({ user_email: userEmail }, upDoc, { arrayFilters: [{ "i.orderId": orderId }] });
                res.send(result);
            }));
            // dispatch order from seller
            app.put("/api/dispatch-order-request/:orderId/:userEmail", verifyJWT, verifySeller, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const orderId = parseInt(req.params.orderId);
                const userEmail = req.params.userEmail;
                res.status(200).send(yield orderCollection.updateOne({ user_email: userEmail }, {
                    $set: {
                        "orders.$[i].dispatch": true,
                    },
                }, { arrayFilters: [{ "i.orderId": orderId }] }));
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
                                    {
                                        $or: [{ "orders.status": "pending" }],
                                    },
                                    { "orders.dispatch": { $ne: true } },
                                    { "orders.seller": seller },
                                ],
                            },
                        },
                    ])
                        .toArray();
                }
                else {
                    result = yield orderCollection
                        .aggregate([
                        { $unwind: "$orders" },
                        {
                            $match: { "orders.dispatch": true },
                        },
                    ])
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
