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
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
module.exports.updateProductQuantity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const db = yield dbConnection();
        const userEmail = req.decoded.email;
        const cart_types = req.params.cartTypes;
        const productId = req.headers.authorization;
        const { quantity } = req.body;
        let updateDocuments;
        let filters;
        if (!productId) {
            return res.status(400).send({ message: "Bad request! headers missing" });
        }
        const availableProduct = yield db.collection("products").findOne({
            _id: ObjectId(productId),
            available: { $gte: 1 },
            stock: "in",
            status: "active",
        });
        if (quantity >= (availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.available) - 1) {
            return res.status(200).send({
                message: "Your selected quantity out of range in available product",
            });
        }
        const cart = yield db.collection("users").findOne({
            email: userEmail,
        });
        if (availableProduct) {
            if (cart_types === "buy") {
                updateDocuments = {
                    $set: {
                        "buy_product.quantity": quantity,
                        "buy_product.totalAmount": parseFloat((_a = cart === null || cart === void 0 ? void 0 : cart.buy_product) === null || _a === void 0 ? void 0 : _a.price) * quantity,
                    },
                };
                filters = {
                    email: userEmail,
                };
            }
            if (cart_types === "toCart") {
                const cartProduct = (cart === null || cart === void 0 ? void 0 : cart.myCartProduct) || [];
                let amount;
                for (let i = 0; i < cartProduct.length; i++) {
                    let items = cartProduct[i];
                    if ((items === null || items === void 0 ? void 0 : items._id) === productId) {
                        amount = (items === null || items === void 0 ? void 0 : items.price) * quantity;
                    }
                }
                updateDocuments = {
                    $set: {
                        "myCartProduct.$.quantity": quantity,
                        "myCartProduct.$.totalAmount": amount,
                    },
                };
                filters = {
                    email: userEmail,
                    "myCartProduct._id": productId,
                };
            }
            const result = yield db
                .collection("users")
                .updateOne(filters, updateDocuments, {
                upsert: true,
            });
            return res.status(200).send(result);
        }
        else {
            yield db
                .collection("users")
                .updateOne({ email: userEmail }, { $pull: { myCartProduct: { _id: productId } } });
            return res.status(200).send({
                message: "This product is out of stock now and removed from your cart",
            });
        }
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.deleteCartItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const productId = req.headers.authorization;
        const userEmail = req.decoded.email;
        const cart_types = req.params.cartTypes;
        let updateDocuments;
        if (!productId) {
            return res.status(400).send({ message: "Bad request! headers missing" });
        }
        if (cart_types === "buy") {
            updateDocuments = yield db
                .collection("users")
                .updateOne({ email: userEmail }, { $unset: { buy_product: "" } });
        }
        else {
            updateDocuments = yield db
                .collection("users")
                .updateOne({ email: userEmail }, { $pull: { myCartProduct: { _id: productId } } });
        }
        res
            .status(200)
            .send({ updateDocuments, message: `removed successfully from cart` });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.addToCartHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const email = req.decoded.email;
        const body = req.body;
        const availableProduct = yield db.collection("products").findOne({
            _id: ObjectId(body === null || body === void 0 ? void 0 : body._id),
            status: "active",
        });
        if ((availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.stock) === "in" && (availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.available) > 0) {
            const existsProduct = yield db
                .collection("users")
                .findOne({ email: email, "myCartProduct._id": body === null || body === void 0 ? void 0 : body._id }, { "myCartProduct.$": 1 });
            if (existsProduct) {
                return res
                    .status(200)
                    .send({ message: "Product Has Already In Your Cart" });
            }
            else {
                body["addedAt"] = new Date(Date.now());
                const cartRes = yield db.collection("users").updateOne({ email: email }, {
                    $push: { myCartProduct: body },
                }, { upsert: true });
                res.status(200).send({
                    data: cartRes,
                    message: "Product Successfully Added To Your Cart",
                });
            }
        }
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.addToBuyHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const userEmail = req.decoded.email;
        const body = req.body;
        const cartRes = yield db
            .collection("users")
            .updateOne({ email: userEmail }, { $set: { buy_product: body } }, { upsert: true });
        res.status(200).send(cartRes);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.addCartAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const userEmail = req.decoded.email;
        const body = req.body;
        const result = yield db
            .collection("users")
            .updateOne({ email: userEmail }, { $push: { address: body } }, { upsert: true });
        res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.updateCartAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const userEmail = req.decoded.email;
        const body = req.body;
        const result = yield db.collection("users").updateOne({ email: userEmail }, {
            $set: {
                "address.$[i]": body,
            },
        }, { arrayFilters: [{ "i.addressId": body === null || body === void 0 ? void 0 : body.addressId }] });
        res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.selectCartAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const userEmail = req.decoded.email;
        const { addressId, select_address } = req.body;
        const addr = yield db.collection("users").findOne({ email: userEmail });
        if (addr) {
            const addressArr = addr === null || addr === void 0 ? void 0 : addr.address;
            if (addressArr && addressArr.length > 0) {
                yield db.collection("users").updateOne({ email: userEmail }, {
                    $set: {
                        "address.$[j].select_address": false,
                    },
                }, {
                    arrayFilters: [{ "j.addressId": { $ne: addressId } }],
                    multi: true,
                });
            }
        }
        let result = yield db.collection("users").updateOne({ email: userEmail }, {
            $set: {
                "address.$[i].select_address": select_address,
            },
        }, { arrayFilters: [{ "i.addressId": addressId }] });
        res.status(200).send(result);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.deleteCartAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const email = req.decoded.email;
        const addressId = parseInt(req.params.addressId);
        const result = yield db
            .collection("users")
            .updateOne({ email: email }, { $pull: { address: { addressId } } });
        if (result)
            return res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
