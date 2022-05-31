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
            const addressCollection = client
                .db("Products")
                .collection("deliveryAddress");
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
                    product: { $elemMatch: { _id: productId } },
                });
                let cardHandler;
                if ((findCart === null || findCart === void 0 ? void 0 : findCart._id) === productId) {
                    cardHandler = true;
                }
                else {
                    cardHandler = false;
                }
                result["cardHandler"] = cardHandler;
                res.send(result);
            }));
            // fetch my added product in my cart page
            app.get("/my-cart-items/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const cartRes = yield cartCollection.findOne({ user_email: userEmail });
                res.send(cartRes);
            }));
            /* fetch one single product to purchase page when user click to buy now button and this product also add to my-cart page*/
            app.get("/my-cart-item/:pId/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const pId = req.params.pId;
                const userEmail = req.params.userEmail;
                const cartRes = yield cartCollection.findOne({
                    product: { $elemMatch: { _id: pId } },
                });
                if ((cartRes === null || cartRes === void 0 ? void 0 : cartRes._id) === pId) {
                    res.send(cartRes);
                }
            }));
            // update product quantity and total price in cart
            // app.put(
            //   "/up-cart-qty-ttl-price/:pId",
            //   async (req: Request, res: Response) => {
            //     const pId = req.params.pId;
            //     const { quantity, total_price } = req.body;
            //     const fill = { _id: ObjectId(pId) };
            //     const result = await cartCollection.updateOne(
            //       fill,
            //       { $set: { quantity: quantity, total_price: total_price } },
            //       { upsert: true }
            //     );
            //     res.send(result);
            //   }
            // );
            app.put("/up-cart-qty-ttl-price/:pId/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const pId = req.params.pId;
                const user_email = req.params.email;
                const { quantity, total_price } = req.body;
                const fill = { user_email: user_email, "product._id": pId };
                const result = yield cartCollection.updateOne(fill, {
                    $set: {
                        "product.$.quantity": quantity,
                        "product.$.total_price": total_price,
                    },
                }, { upsert: true });
                res.send(result);
            }));
            // remove item form cart with item cart id
            app.delete("/delete-cart-item/:pcId/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const pcId = req.params.pcId;
                const email = req.params.email;
                const res2 = yield cartCollection.updateOne({
                    user_email: email,
                }, {
                    $pull: {
                        product: {
                            _id: pcId,
                        },
                    },
                });
                res.send(res2);
            }));
            app.put("/my-cart/:email", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                const body = req.body;
                const options = { upsert: true };
                const query = { user_email: email };
                const existsProduct = yield cartCollection.findOne({ user_email: email });
                let newProduct;
                if (existsProduct) {
                    const productArr = existsProduct === null || existsProduct === void 0 ? void 0 : existsProduct.product;
                    for (let i = 0; i < productArr.length; i++) {
                        let elem = productArr[i]._id;
                        if (elem === (body === null || body === void 0 ? void 0 : body._id)) {
                            res.send({ message: "Already added" });
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
                const up = {
                    $set: { product: newProduct },
                };
                const cartRes = yield cartCollection.updateOne(query, up, options);
                res.send(cartRes);
            }));
            // add product to the cart
            // app.put("/my-cart/:pId", async (req: Request, res: Response) => {
            //   const productId = req.params.pId;
            //   const {
            //     _id: product_id,
            //     title,
            //     price,
            //     category,
            //     image,
            //     quantity,
            //     total_price,
            //     user_email,
            //   } = req.body;
            //   const newCart = {
            //     product_id,
            //     title,
            //     price,
            //     category,
            //     image,
            //     user_email,
            //     quantity,
            //     total_price,
            //   };
            //   const option = { upsert: true };
            //   const query = { product_id: productId };
            //   const upDoc = {
            //     $set: newCart,
            //   };
            //   const cartRes = await cartCollection.updateOne(query, upDoc, option);
            //   res.send(cartRes);
            // });
            // order address add api
            app.put("/order-address/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const body = req.body;
                const option = { upsert: true };
                const query = { user_email: userEmail };
                const updateDoc = {
                    $set: body,
                };
                const result = yield addressCollection.updateOne(query, updateDoc, option);
                res.send(result);
            }));
            // get order address
            app.get("/cart-address/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const result = yield addressCollection.findOne({
                    user_email: userEmail,
                });
                res.send(result);
            }));
            /// jdfhdfjbjdfbj
            app.post("/set-order/:userEmail", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userEmail = req.params.userEmail;
                const body = req.body;
                // const query = { user_email: userEmail };
                body["user_email"] = userEmail;
                const result = yield orderCollection.insertOne(body);
                const order = yield orderCollection.findOne({
                    user_email: userEmail,
                    orderId: body === null || body === void 0 ? void 0 : body.orderId,
                });
                res.send({ result, orderId: order === null || order === void 0 ? void 0 : order.orderId });
            }));
            // get order list
            app.get("/get-orderlist/:orderId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const order_id = parseInt(req.params.orderId);
                const result = yield orderCollection.findOne({ orderId: order_id });
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
