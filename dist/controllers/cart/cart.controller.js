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
const checkProductAvailability = (db, productId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db.collection("products").findOne({
        _id: ObjectId(productId),
        available: { $gte: 1 },
        stock: "in",
        status: "active",
    });
});
const responseSender = (res, success, message, data = null) => {
    return success
        ? res.status(200).send({ success: true, statusCode: 200, message, data })
        : res.status(400).send({
            success: false,
            statusCode: 400,
            error: message,
        });
};
const saveToDBHandler = (filter, documents) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbConnection();
    return yield db.collection("users").updateOne(filter, documents, {
        upsert: true,
    });
});
// update product quantity controller
module.exports.updateProductQuantity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const db = yield dbConnection();
        const userEmail = req.decoded.email;
        const cart_types = req.params.cartTypes;
        const productId = req.headers.authorization;
        const { quantity } = req.body;
        // undefined variables
        let updateDocuments;
        let filters;
        if (!productId || typeof productId === "undefined" || productId === null) {
            return responseSender(res, false, "Bad request! headers missing");
        }
        const availableProduct = yield checkProductAvailability(db, productId);
        if (!availableProduct ||
            typeof availableProduct === "undefined" ||
            availableProduct === null) {
            return responseSender(res, false, "Product not available");
        }
        if (quantity >= (availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.available) - 1) {
            return responseSender(res, false, "Your selected quantity out of range in available product");
        }
        const cart = yield db.collection("users").findOne({
            email: userEmail,
        });
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
        const result = yield saveToDBHandler(filters, updateDocuments);
        if (result === null || result === void 0 ? void 0 : result.modifiedCount) {
            return responseSender(res, true, "Quantity updated.");
        }
        else {
            return responseSender(res, false, "Failed to update this quantity!");
        }
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.deleteCartItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = req.headers.authorization;
        const userEmail = req.decoded.email;
        const cart_types = req.params.cartTypes;
        let updateDocuments;
        if (!ObjectId.isValid(productId) || !productId) {
            return responseSender(res, false, "Bad request! headers missing");
        }
        if (cart_types === "buy") {
            updateDocuments = yield saveToDBHandler({ email: userEmail }, { $unset: { buy_product: "" } });
        }
        if (cart_types === "toCart") {
            updateDocuments = yield saveToDBHandler({ email: userEmail }, { $pull: { myCartProduct: { _id: productId } } });
        }
        if (updateDocuments === null || updateDocuments === void 0 ? void 0 : updateDocuments.modifiedCount) {
            return responseSender(res, true, "Item removed successfully from your cart.");
        }
        else {
            return responseSender(res, false, "Sorry! failed to remove.");
        }
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
        const availableProduct = yield checkProductAvailability(db, body === null || body === void 0 ? void 0 : body._id);
        if ((availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.stock) === "out" && (availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.available) <= 0) {
            return responseSender(res, false, "This product out of stock now!");
        }
        const existsProduct = yield db
            .collection("users")
            .findOne({ email: email, "myCartProduct._id": body === null || body === void 0 ? void 0 : body._id }, { "myCartProduct.$": 1 });
        if (existsProduct) {
            return responseSender(res, false, "Product Has Already In Your Cart");
        }
        body["addedAt"] = new Date(Date.now());
        const cartRes = yield saveToDBHandler({ email: email }, {
            $push: { myCartProduct: body },
        });
        return responseSender(res, true, "Product successfully added to your cart", cartRes);
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
        if (cartRes) {
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Product ready to buy.",
            });
        }
        else {
            return res
                .status(400)
                .send({ success: false, statusCode: 400, error: "Failed to buy" });
        }
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
        if (!result) {
            return res.status(400).send({
                success: false,
                statusCode: 400,
                error: "Failed to add address in this cart",
            });
        }
        res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Successfully shipping address added in your cart.",
        });
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
        if (result) {
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Shipping address updated.",
            });
        }
        else {
            return res.status(400).send({
                success: false,
                statusCode: 400,
                error: "Failed to update shipping address.",
            });
        }
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
        const result = yield db.collection("users").updateOne({ email: userEmail }, {
            $set: {
                "address.$[i].select_address": select_address,
            },
        }, { arrayFilters: [{ "i.addressId": addressId }] });
        if (!result) {
            return res.status(400).send({
                success: false,
                statusCode: 400,
                error: "Failed to select the address",
            });
        }
        return res
            .status(200)
            .send({ success: true, statusCode: 200, message: "Saved" });
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
