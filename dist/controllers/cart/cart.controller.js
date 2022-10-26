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
const { cartTemplate } = require("../../templates/cart.template");
const checkProductAvailability = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbConnection();
    const result = yield db.collection('products').aggregate([]).toArray();
    return yield db.collection("products").findOne({
        $and: [
            { _id: ObjectId(productId) },
            { 'stockInfo.available': { $gte: 1 } },
            { 'stockInfo.stock': "in" },
            { status: "active" }
        ]
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
// Show My Cart Items;
module.exports.showMyCartItemsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const authEmail = req.decoded.email;
        const cartItems = yield db.collection('shoppingCarts').find({ customerEmail: authEmail }).toArray();
        if (cartItems) {
            return res.status(200).send({ success: true, statusCode: 200, data: { items: cartItems.length, products: cartItems } });
        }
    }
    catch (error) {
        return res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
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
        const availableProduct = yield checkProductAvailability(productId);
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
            const cartProduct = (cart === null || cart === void 0 ? void 0 : cart.shoppingCartItems) || [];
            let amount;
            for (let i = 0; i < cartProduct.length; i++) {
                let items = cartProduct[i];
                if ((items === null || items === void 0 ? void 0 : items._id) === productId) {
                    amount = (items === null || items === void 0 ? void 0 : items.price) * quantity;
                }
            }
            updateDocuments = {
                $set: {
                    "shoppingCartItems.$.quantity": quantity,
                    "shoppingCartItems.$.totalAmount": amount,
                },
            };
            filters = {
                email: userEmail,
                "shoppingCartItems._id": productId,
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
        const authEmail = req.decoded.email;
        const cart_types = req.params.cartTypes;
        let updateDocuments;
        const db = yield dbConnection();
        if (!ObjectId.isValid(productId) || !productId) {
            return responseSender(res, false, "Bad request! headers missing");
        }
        if (cart_types === "buy") {
            updateDocuments = yield saveToDBHandler({ email: authEmail }, { $unset: { buy_product: "" } });
        }
        if (cart_types === "toCart") {
            // updateDocuments = await saveToDBHandler(
            //   { email: authEmail },
            //   { $pull: { shoppingCartItems: { _id: productId } } }
            // );
            updateDocuments = yield db.collection('shoppingCarts').deleteOne({ $and: [{ customerEmail: authEmail }, { productId }] });
        }
        if (updateDocuments) {
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
// add to cart controller
module.exports.addToCartHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    try {
        const db = yield dbConnection();
        const email = req.decoded.email;
        const body = req.body;
        const availableProduct = yield checkProductAvailability(body === null || body === void 0 ? void 0 : body.productId);
        if (((_b = availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.stockInfo) === null || _b === void 0 ? void 0 : _b.stock) === "out" && ((_c = availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.stockInfo) === null || _c === void 0 ? void 0 : _c.available) <= 0) {
            return responseSender(res, false, "This product out of stock now!");
        }
        const existsProduct = yield db.collection("shoppingCarts").findOne({ $and: [{ customerEmail: email }, { productId: body === null || body === void 0 ? void 0 : body.productId }] });
        if (existsProduct) {
            return res.status(400).send({ success: false, statusCode: 400, error: "Product Has Already In Your Cart" });
        }
        const cartTem = cartTemplate(availableProduct, email, body === null || body === void 0 ? void 0 : body.productId);
        const result = yield db.collection('shoppingCarts').insertOne(cartTem);
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart" });
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
            .updateOne({ email: userEmail }, { $push: { shippingAddress: body } }, { upsert: true });
        if (!result) {
            return res.status(400).send({
                success: false,
                statusCode: 400,
                error: "Failed to add address in this cart",
            });
        }
        return res.status(200).send({
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
                "shippingAddress.$[i]": body,
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
        const user = yield db.collection("users").findOne({ email: userEmail });
        if (!user) {
            return res.status(404).send({ success: false, statusCode: 404, error: 'User not found !!!' });
        }
        const shippingAddress = (user === null || user === void 0 ? void 0 : user.shippingAddress) || [];
        if (shippingAddress && shippingAddress.length > 0) {
            yield db.collection("users").updateOne({ email: userEmail }, {
                $set: {
                    "shippingAddress.$[j].select_address": false,
                },
            }, {
                arrayFilters: [{ "j.addressId": { $ne: addressId } }],
                multi: true,
            });
            const result = yield db.collection("users").updateOne({ email: userEmail }, {
                $set: {
                    "shippingAddress.$[i].select_address": select_address,
                },
            }, { arrayFilters: [{ "i.addressId": addressId }] });
            if (!result) {
                return res.status(400).send({
                    success: false,
                    statusCode: 400,
                    error: "Failed to select the address",
                });
            }
            return res.status(200).send({ success: true, statusCode: 200, message: "Shipping address Saved." });
        }
    }
    catch (error) {
        res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.deleteCartAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const email = req.decoded.email;
        const addressId = parseInt(req.params.addressId);
        const result = yield db
            .collection("users")
            .updateOne({ email: email }, { $pull: { shippingAddress: { addressId } } });
        if (result)
            return res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.checkCartItemExpirationController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let authEmail = req.decoded.email;
        let productId = req.params.productId;
        const db = yield dbConnection();
        const product = yield db.collection('users').updateOne({ email: authEmail }, { $pull: { shoppingCartItems: { _id: productId } } }, { upsert: true });
        if (product) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Deleted Expired product from your cart" });
        }
    }
    catch (error) {
        return res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.updateCartProductQuantityController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const db = yield dbConnection();
        const authEmail = req.decoded.email || "";
        const body = req.body;
        const upsertRequest = body === null || body === void 0 ? void 0 : body.upsertRequest;
        const cartContext = upsertRequest === null || upsertRequest === void 0 ? void 0 : upsertRequest.cartContext;
        const { productId, cartId, quantity } = cartContext;
        const cartProduct = yield db.collection('shoppingCarts').findOne({ $and: [{ customerEmail: authEmail }, { productId }, { _id: ObjectId(cartId) }] });
        if (!cartProduct) {
            return res.status(404).send({ success: false, statusCode: 404, error: 'product not found !!!' });
        }
        const availableProduct = yield checkProductAvailability(productId);
        if (!availableProduct || typeof availableProduct === "undefined" || availableProduct === null) {
            return res.status(400).send({ success: false, statusCode: 400, error: "Product not available" });
        }
        if (parseInt(quantity) >= ((_d = availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.stockInfo) === null || _d === void 0 ? void 0 : _d.available)) {
            return res.status(400).send({ success: false, statusCode: 400, error: "Sorry ! your selected quantity out of range." });
        }
        let price = parseFloat(cartProduct === null || cartProduct === void 0 ? void 0 : cartProduct.price) || 0;
        let amount = (price * quantity);
        const result = yield db.collection('shoppingCarts').updateOne({
            $and: [{ customerEmail: authEmail }, { productId }, { _id: ObjectId(cartId) }]
        }, {
            $set: {
                quantity,
                totalAmount: amount
            }
        }, {
            upsert: true,
        });
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: 'Quantity updated.' });
        }
    }
    catch (error) {
        return res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
