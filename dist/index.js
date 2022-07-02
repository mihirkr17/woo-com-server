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
// Server setup
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = (0, express_1.default)();
var jwt = require("jsonwebtoken");
// middleware
app.use(cors());
app.use(express_1.default.json());
// port and db connection
const port = process.env.PORT || 5000;
// database information
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.8bccj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});
// verifying jwt token
const verifyJWT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(403).send({ message: "Unauthorized Access" });
    const token = authHeader.split(" ")[1];
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
            if (err) {
                return res.status(401).send({ message: err.message });
            }
            req.decoded = decoded;
            next();
        });
    }
});
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            // product collection
            const productsCollection = client.db("Products").collection("product");
            const cartCollection = client.db("Products").collection("cart");
            const orderCollection = client.db("Products").collection("orders");
            const userCollection = client.db("Users").collection("user");
            const reviewCollection = client.db("Products").collection("review");
            // // verify owner
            const verifyOwner = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                const authEmail = req.decoded.email;
                const findOwnerInDB = yield userCollection.findOne({
                    email: authEmail && authEmail,
                });
                if (findOwnerInDB.role === "owner") {
                    next();
                }
                else {
                    res.status(403).send({ message: "Unauthorized" });
                }
            });
            // get products by some condition in manage product page api
            app.get("/api/manage-product", (req, res) => __awaiter(this, void 0, void 0, function* () {
                let item;
                let page;
                let email = req.query.email;
                item = req.query.items;
                page = req.query.page;
                let searchText = req.query.search;
                let filters = req.query.category;
                let cursor;
                let result;
                const searchQuery = (sTxt, email = "") => {
                    item = "";
                    page = "";
                    let findProduct = {
                        $or: [
                            { title: { $regex: sTxt, $options: "i" } },
                            { seller: { $regex: sTxt, $options: "i" } },
                        ],
                    };
                    if (email) {
                        findProduct["seller"] = email;
                    }
                    return findProduct;
                };
                const filterQuery = (category, email = "") => {
                    item = "";
                    page = "";
                    let findProduct = {
                        category: category,
                    };
                    if (email) {
                        findProduct["seller"] = email;
                    }
                    return findProduct;
                };
                cursor =
                    searchText && searchText.length > 0
                        ? productsCollection.find(searchQuery(searchText, email || ""))
                        : filters && filters !== "all"
                            ? productsCollection.find(filterQuery(filters, email || ""))
                            : productsCollection.find({ seller: email } || {});
                if (item || page) {
                    result = yield cursor
                        .skip(parseInt(page) * parseInt(item))
                        .limit(parseInt(item))
                        .toArray();
                }
                else {
                    result = yield cursor.toArray();
                }
                res.send(result);
            }));
            // product count
            app.get("/api/product-count", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.query.email;
                let result;
                if (email) {
                    result = yield productsCollection.find({ seller: email }).toArray();
                    result = result.length;
                }
                else {
                    result = yield productsCollection.estimatedDocumentCount();
                }
                res.send({ count: result });
            }));
            // update data
            app.put("/update-profile-data/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                const data = req.body;
                const result = yield userCollection.updateOne({ email: email }, { $set: req.body }, { upsert: true });
                res.status(200).send(result);
            }));
            // fetch myProfile data in my profile page
            app.get("/my-profile/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                res.status(200).send(yield userCollection.findOne({ email: email }));
            }));
            // make admin request
            app.put("/make-admin/:userId", verifyJWT, verifyOwner, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userId = req.params.userId;
                res.send(yield userCollection.updateOne({ _id: ObjectId(userId) }, { $set: { role: "admin" } }, { upsert: true }));
            }));
            // get all user in allUser Page
            app.get("/all-users", (req, res) => __awaiter(this, void 0, void 0, function* () {
                res.send(yield userCollection.find({ role: { $ne: "owner" } }).toArray());
            }));
            // get owner, admin and user from database
            app.get("/fetch-auth/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const email = req.params.email;
                const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
                if (token) {
                    const result = yield userCollection.findOne({ email: email });
                    if (result && result.role === "owner") {
                        res.status(200).send({ role: "owner" });
                    }
                    if (result && result.role === "admin") {
                        res.status(200).send({ role: "admin" });
                    }
                }
                else {
                    return res.status(403).send({ message: "Header Missing" });
                }
            }));
            // add user to the database
            app.put("/user/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                const findUser = yield userCollection.findOne({ email: email });
                let updateDocuments;
                updateDocuments =
                    findUser && (findUser === null || findUser === void 0 ? void 0 : findUser.role) !== ""
                        ? { $set: { email } }
                        : { $set: { email, role: "user" } };
                const result = yield userCollection.updateOne({ email: email }, updateDocuments, { upsert: true });
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
                    algorithm: "HS256",
                    expiresIn: "6h",
                });
                res.send({ result, token });
            }));
            // inserting product into database
            app.post("/add-product", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const body = req.body;
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
            app.get("/view-product/:productId/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                const id = req.params.productId;
                const filterP = yield cartCollection
                    .aggregate([
                    { $unwind: "$product" },
                    { $match: { user_email: email, "product._id": id } },
                ])
                    .toArray();
                let result = yield productsCollection.findOne({
                    _id: ObjectId(id),
                });
                const exist = filterP.some((f) => { var _a; return ((_a = f === null || f === void 0 ? void 0 : f.product) === null || _a === void 0 ? void 0 : _a._id) == id; });
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
                    category: productCategory,
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
                const pId = req.params.productId;
                const result = yield reviewCollection
                    .aggregate([
                    { $unwind: "$rating" },
                    { $match: { "rating.product_id": pId } },
                ])
                    .toArray();
                res.send(result);
            }));
            // fetch my added product in my cart page
            app.get("/my-cart-items/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const cartRes = yield cartCollection.findOne({ user_email: userEmail });
                res.send(cartRes);
            }));
            /* fetch one single product to purchase page when user click to buy now button
            and this product also add to my-cart page*/
            app.get("/my-cart-item/:pId/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const pId = req.params.pId;
                const email = req.params.userEmail;
                const findP = yield cartCollection
                    .aggregate([
                    { $unwind: "$product" },
                    { $match: { "product._id": pId, user_email: email } },
                ])
                    .toArray();
                findP.map((p) => res.send(p));
            }));
            // update quantity of product in my-cart
            app.put("/up-cart-qty-ttl-price/:pId/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const pId = req.params.pId;
                const user_email = req.params.email;
                const { quantity, price_total, discount_amount_total } = req.body;
                const fill = { user_email: user_email, "product._id": pId };
                const result = yield cartCollection.updateOne(fill, {
                    $set: {
                        "product.$.quantity": quantity,
                        "product.$.price_total": price_total,
                        "product.$.discount_amount_total": discount_amount_total,
                    },
                }, { upsert: true });
                res.send(result);
            }));
            // remove item form cart with item cart id and email
            app.delete("/delete-cart-item/:pcId/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const pcId = req.params.pcId;
                const email = req.params.email;
                const res2 = yield cartCollection.updateOne({ user_email: email }, { $pull: { product: { _id: pcId } } });
                res.send(res2);
            }));
            // inserting product into my cart api
            app.put("/my-cart/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                let newProduct;
                const email = req.params.email;
                const body = req.body;
                const options = { upsert: true };
                const query = { user_email: email };
                const existsProduct = yield cartCollection.findOne({ user_email: email });
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
            }));
            // order address add api
            app.put("/add-address/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const body = req.body;
                const result = yield cartCollection.updateOne({ user_email: userEmail }, { $set: { address: body } }, { upsert: true });
                res.send(result);
            }));
            // update select_address in address to confirm for order api
            app.put("/select-address/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const body = req.body;
                const result = yield cartCollection.updateOne({ user_email: userEmail }, { $set: { "address.select_address": body === null || body === void 0 ? void 0 : body.select_address } }, { upsert: true });
                res.send(result);
            }));
            // delete or remove address from cart
            app.delete("/delete-address/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                const result = yield cartCollection.updateOne({ user_email: email }, { $set: { address: null } }, { upsert: true });
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
            app.delete("/cancel-order/:email/:orderId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                const id = parseInt(req.params.orderId);
                const result = yield orderCollection.updateOne({ user_email: email }, { $pull: { orders: { orderId: id } } });
                res.send({ result, message: "Order Cancelled successfully" });
            }));
            // update order status by admin or product owner
            app.put("/update-order-status/:status/:user_email/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const orderId = parseInt(req.params.id);
                const status = req.params.status;
                const userEmail = req.params.user_email;
                const { ownerCommission, totalEarn, seller_email } = req.body;
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
                            "orders.$[i].time_placed": time,
                        },
                    };
                    if (ownerCommission && totalEarn) {
                        const ownerCol = yield userCollection.findOne({ role: "owner" });
                        let adminCol = yield userCollection.findOne({
                            email: seller_email,
                        });
                        if (ownerCol) {
                            let ownerTotalEarn = ownerCol === null || ownerCol === void 0 ? void 0 : ownerCol.total_earn;
                            let ownerComm = parseFloat(ownerCommission);
                            let earn = parseFloat(ownerTotalEarn) + ownerComm;
                            yield userCollection.updateOne({ role: "owner" }, { $set: { total_earn: earn } }, { upsert: true });
                        }
                        if (adminCol) {
                            let totalEarned = adminCol === null || adminCol === void 0 ? void 0 : adminCol.total_earn;
                            let totalEr = parseFloat(totalEarn);
                            totalEarned = parseFloat(totalEarned) + totalEr;
                            yield userCollection.updateOne({ email: seller_email }, { $set: { total_earn: totalEarned } }, { upsert: true });
                        }
                    }
                }
                const rs = yield orderCollection.updateOne({ user_email: userEmail }, upDoc, { arrayFilters: [{ "i.orderId": orderId }] });
                res.send(rs);
            }));
            // get order list
            app.get("/get-orderlist/:orderId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const order_id = parseInt(req.params.orderId);
                const result = yield orderCollection.findOne({ orderId: order_id });
                res.send(result);
            }));
            /// find orderId
            app.get("/manage-orders", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.query.email;
                let result;
                if (email) {
                    result = yield orderCollection
                        .aggregate([
                        { $unwind: "$orders" },
                        {
                            $match: {
                                "orders.seller": email,
                            },
                        },
                    ])
                        .toArray();
                }
                else {
                    result = yield orderCollection
                        .aggregate([{ $unwind: "$orders" }])
                        .toArray();
                }
                res.send(result);
            }));
        }
        finally {
        }
    });
}
run();
app.get("/", (req, res) => {
    res.send("Server running");
});
app.listen(port, () => {
    console.log(`Running port is ${port}`);
});
