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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            // product collection
            const productsCollection = client.db("Products").collection("product");
            const cartCollection = client.db("Products").collection("cart");
            const orderCollection = client.db("Products").collection("orders");
            const singleCartCollection = client.db("Products").collection("singleCart");
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
            app.get("/view-product/:productId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productId;
                let result = yield productsCollection.findOne({
                    _id: ObjectId(productId),
                });
                const findCart = yield cartCollection.findOne({
                    product_id: productId,
                });
                let cardHandler;
                if (findCart === null || findCart === void 0 ? void 0 : findCart.product_id) {
                    cardHandler = true;
                }
                else {
                    cardHandler = false;
                }
                result["cardHandler"] = cardHandler;
                res.send(result);
            }));
            // adding product to my cart
            app.post("/my-cart/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const user_email = req.params.userEmail;
                const { _id: product_id, title, price, category, image, quantity, total_price, } = req.body;
                const newCart = {
                    product_id,
                    title,
                    price,
                    category,
                    image,
                    user_email,
                    quantity,
                    total_price,
                };
                const cartRes = yield cartCollection.insertOne(newCart);
                res.send(cartRes);
            }));
            // fetch all item in my cart
            app.get("/my-cart-items/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const cartRes = yield cartCollection
                    .find({ user_email: userEmail })
                    .toArray();
                res.send(cartRes);
            }));
            // update cart
            app.put("/update-cart/:pId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const pId = req.params.pId;
                const { quantity, total_price } = req.body;
                const fill = { _id: ObjectId(pId) };
                const result = yield cartCollection.updateOne(fill, { $set: { quantity: quantity, total_price: total_price } }, { upsert: true });
                res.send(result);
            }));
            // remove item form cart with item cart id
            app.delete("/delete-cart-item/:pcId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const pcId = req.params.pcId;
                const res1 = yield singleCartCollection.deleteOne({
                    _id: ObjectId(pcId),
                });
                const res2 = yield cartCollection.deleteOne({ _id: ObjectId(pcId) });
                res.send(res1 || res2);
            }));
            // order address add api
            app.put("/order-address/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const body = req.body;
                const option = { upsert: true };
                const query = { user_email: userEmail };
                const updateDoc = {
                    $set: body,
                };
                const result = yield orderCollection.updateOne(query, updateDoc, option);
                res.send(result);
            }));
            // get order address
            app.get("/order-address/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const result = yield orderCollection.findOne({
                    user_email: userEmail,
                });
                res.send(result);
            }));
            // single cart product
            app.put("/single-cart-product/:pId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.pId;
                const { _id: product_id, title, price, category, image, quantity, total_price, user_email, } = req.body;
                const newCart = {
                    product_id,
                    title,
                    price,
                    category,
                    image,
                    user_email,
                    quantity,
                    total_price,
                };
                const option = { upsert: true };
                const query = { _id: ObjectId(productId) };
                const upDoc = {
                    $set: newCart,
                };
                const cartRes = yield singleCartCollection.updateOne(query, upDoc, option);
                res.send(cartRes);
            }));
            // fetch one item in my single cart product
            app.get("/single-cart-product/:pId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const pId = req.params.pId;
                const cartRes = yield singleCartCollection.findOne({ product_id: pId });
                res.send(cartRes);
            }));
            // inserting user
            app.put("/user", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const uid = req.query.uid;
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
