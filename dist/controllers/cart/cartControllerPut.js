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
const ShoppingCart = require("../../model/shoppingCart.model");
const User = require("../../model/user.model");
const Product = require("../../model/product.model");
const checkProductAvailability = (productID, variationID) => __awaiter(void 0, void 0, void 0, function* () {
    let product = yield Product.aggregate([
        { $match: { _id: ObjectId(productID) } },
        { $unwind: { path: "$variations" } },
        {
            $match: {
                $and: [
                    { 'variations._VID': variationID },
                    { 'variations.available': { $gte: 1 } },
                    { 'variations.stock': 'in' }
                ]
            }
        }
    ]);
    product = product[0];
    return product;
});
module.exports.updateCartProductQuantityController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let cartProduct;
        let result;
        const authEmail = req.decoded.email || "";
        const body = req.body;
        const cartType = (_a = body === null || body === void 0 ? void 0 : body.actionRequestContext) === null || _a === void 0 ? void 0 : _a.type;
        const upsertRequest = body === null || body === void 0 ? void 0 : body.upsertRequest;
        const cartContext = upsertRequest === null || upsertRequest === void 0 ? void 0 : upsertRequest.cartContext;
        const { productID, variationID, cartID, quantity } = cartContext;
        if (cartType === 'toCart') {
            cartProduct = yield ShoppingCart.findOne({ $and: [{ customerEmail: authEmail }, { productID }, { _id: ObjectId(cartID) }] });
            if (!cartProduct) {
                return res.status(404).send({ success: false, statusCode: 404, error: 'product not found !!!' });
            }
        }
        const productAvailability = yield checkProductAvailability(productID, variationID);
        if (!productAvailability || typeof productAvailability === "undefined" || productAvailability === null) {
            return res.status(400).send({ success: false, statusCode: 400, error: "Product not available" });
        }
        if (parseInt(quantity) >= ((_b = productAvailability === null || productAvailability === void 0 ? void 0 : productAvailability.variations) === null || _b === void 0 ? void 0 : _b.available)) {
            return res.status(200).send({ success: false, statusCode: 200, message: "Sorry ! your selected quantity out of range." });
        }
        if (cartType === 'toCart') {
            result = yield ShoppingCart.updateOne({
                $and: [{ customerEmail: authEmail }, { productID }, { _id: ObjectId(cartID) }]
            }, {
                $set: {
                    quantity,
                }
            }, {
                upsert: true,
            });
        }
        if (cartType === "buy") {
            result = yield User.updateOne({
                email: authEmail
            }, {
                $set: {
                    "buyer.buyProduct.quantity": quantity,
                }
            }, {
                upsert: true,
            });
        }
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: `Quantity updated to ${quantity}.` });
        }
    }
    catch (error) {
        next(error);
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
