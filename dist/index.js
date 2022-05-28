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
                const { _id: product_id, title, price, category, image, quantity } = req.body;
                const newCart = { product_id, title, price, category, image, user_email, quantity };
                const cartRes = yield cartCollection.insertOne(newCart);
                res.send(cartRes);
            }));
            // fetch all item in my cart
            app.get("/my-cart-items/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const cartRes = yield cartCollection.find({ user_email: userEmail }).toArray();
                res.send(cartRes);
            }));
            // update cart
            app.put('/update-cart/:pId', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const pId = req.params.pId;
                const { quantity, total_price } = req.body;
                const fill = { _id: ObjectId(pId) };
                const result = yield cartCollection.updateOne(fill, { $set: { quantity: quantity, total_price: total_price } }, { upsert: true });
                res.send(result);
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
