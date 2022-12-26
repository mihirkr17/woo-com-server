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
const checkProductAvailability = (productId, variationId) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbConnection();
    let product = yield db.collection('products').aggregate([
        { $match: { _id: ObjectId(productId) } },
        { $unwind: { path: "$variations" } },
        {
            $match: {
                $and: [
                    { 'variations.vId': variationId },
                    { 'variations.available': { $gte: 1 } },
                    { 'variations.stock': 'in' }
                ]
            }
        }
    ]).toArray();
    product = product[0];
    return product;
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
module.exports.updateCartProductQuantityController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const db = yield dbConnection();
        const authEmail = req.decoded.email || "";
        const body = req.body;
        const upsertRequest = body === null || body === void 0 ? void 0 : body.upsertRequest;
        const cartContext = upsertRequest === null || upsertRequest === void 0 ? void 0 : upsertRequest.cartContext;
        const { productId, variationId, cartId, quantity } = cartContext;
        const cartProduct = yield db.collection('shoppingCarts').findOne({ $and: [{ customerEmail: authEmail }, { productId }, { _id: ObjectId(cartId) }] });
        if (!cartProduct) {
            return res.status(404).send({ success: false, statusCode: 404, error: 'product not found !!!' });
        }
        const availableProduct = yield checkProductAvailability(productId, variationId);
        if (!availableProduct || typeof availableProduct === "undefined" || availableProduct === null) {
            return res.status(400).send({ success: false, statusCode: 400, error: "Product not available" });
        }
        if (parseInt(quantity) >= ((_a = availableProduct === null || availableProduct === void 0 ? void 0 : availableProduct.variations) === null || _a === void 0 ? void 0 : _a.available)) {
            return res.status(400).send({ success: false, statusCode: 400, error: "Sorry ! your selected quantity out of range." });
        }
        // let price = parseFloat(cartProduct?.price) || 0;
        // let amount = (price * quantity);
        const result = yield db.collection('shoppingCarts').updateOne({
            $and: [{ customerEmail: authEmail }, { productId }, { _id: ObjectId(cartId) }]
        }, {
            $set: {
                quantity,
                // totalAmount: amount
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
