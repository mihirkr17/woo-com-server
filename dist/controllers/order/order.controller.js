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
const { updateProductStock } = require("../../utils/common");
const { orderModel } = require("../../model/order");
module.exports.setOrderHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productsCollection = dbh.db("Products").collection("product");
        const orderCollection = dbh.db("Products").collection("orders");
        const userCollection = dbh.db("Users").collection("user");
        const userEmail = req.headers.authorization || "";
        const verifiedEmail = req.decoded.email;
        const body = req.body;
        const products = yield productsCollection.findOne({
            _id: ObjectId(body === null || body === void 0 ? void 0 : body.productId),
        });
        if (userEmail !== verifiedEmail)
            return res.status(401).send({ message: "Unauthorized access" });
        if (body) {
            if (products && (products === null || products === void 0 ? void 0 : products.available) > (body === null || body === void 0 ? void 0 : body.quantity)) {
                let model = orderModel(body);
                const result = yield orderCollection.updateOne({ user_email: userEmail }, { $push: { orders: model } }, { upsert: true });
                if (result) {
                    yield updateProductStock(body === null || body === void 0 ? void 0 : body.productId, body === null || body === void 0 ? void 0 : body.quantity, "dec");
                    yield userCollection.updateOne({ email: userEmail }, { $unset: { myCartProduct: [] } });
                }
                res.status(200).send(result && { message: "Order success" });
            }
            else {
                return res.status(400).send({
                    message: "Order not taken because this product not available rights now!",
                });
            }
        }
        else {
            return res.status(400).send({ message: "Bad request!" });
        }
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.myOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const orderCollection = dbh.db("Products").collection("orders");
        const email = req.params.email;
        res.send(yield orderCollection.findOne({ user_email: email }));
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.removeOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const orderCollection = dbh.db("Products").collection("orders");
        const orderUserEmail = req.params.email;
        const id = parseInt(req.params.orderId);
        const result = yield orderCollection.updateOne({ user_email: orderUserEmail }, { $pull: { orders: { orderId: id } } });
        res.status(200).send({ result, message: "Order Removed successfully" });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.cancelMyOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const orderCollection = dbh.db("Products").collection("orders");
        const userEmail = req.params.userEmail;
        const orderId = parseInt(req.params.orderId);
        const { status, cancel_reason, time_canceled, quantity, productId } = req.body;
        const result = yield orderCollection.updateOne({ user_email: userEmail }, {
            $set: {
                "orders.$[i].status": status,
                "orders.$[i].cancel_reason": cancel_reason,
                "orders.$[i].time_canceled": time_canceled,
            },
        }, { arrayFilters: [{ "i.orderId": orderId }] });
        if (result) {
            yield updateProductStock(productId, quantity, "inc");
        }
        res.send({ result, message: "Order canceled successfully" });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.dispatchOrderRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const orderCollection = dbh.db("Products").collection("orders");
        const orderId = parseInt(req.params.orderId);
        const trackingId = req.params.trackingId;
        const userEmail = req.headers.authorization || "";
        res.status(200).send((yield orderCollection.updateOne({ user_email: userEmail }, {
            $set: {
                "orders.$[i].status": "dispatch",
            },
        }, {
            arrayFilters: [{ "i.orderId": orderId, "i.trackingId": trackingId }],
        })) && { message: "Successfully order dispatched" });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.manageOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const orderCollection = dbh.db("Products").collection("orders");
        const seller = req.query.seller;
        let result;
        if (seller) {
            result = yield orderCollection
                .aggregate([
                { $unwind: "$orders" },
                {
                    $match: {
                        $and: [{ "orders.seller": seller }],
                    },
                },
            ])
                .toArray();
        }
        res.status(200).send(result);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
