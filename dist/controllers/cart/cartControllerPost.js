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
const checkProductAvailability = (productId, variationId) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbConnection();
    let product = yield db.collection('products').aggregate([
        { $match: { _id: ObjectId(productId) } },
        { $unwind: { path: "$variations" } },
        { $match: { $and: [{ 'variations._vId': variationId }, { 'variations.available': { $gte: 1 } }, { 'variations.stock': 'in' }] } }
    ]).toArray();
    product = product[0];
    return product;
});
// add to cart controller
/**
 * @controller --> add product to cart
 * @required --> BODY [productId, variationId]
 * @request_method --> POST
 */
module.exports.addToCartHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const authEmail = req.decoded.email;
        const body = req.body;
        const availableProduct = yield checkProductAvailability(body === null || body === void 0 ? void 0 : body.productId, body === null || body === void 0 ? void 0 : body.variationId);
        if (!availableProduct) {
            return res.status(503).send({ success: false, statusCode: 503, error: "Sorry! This product is out of stock now!" });
        }
        const existsProduct = yield db.collection("shoppingCarts").findOne({ $and: [{ customerEmail: authEmail }, { variationId: body === null || body === void 0 ? void 0 : body.variationId }] });
        if (existsProduct) {
            return res.status(400).send({ success: false, statusCode: 400, error: "Product Has Already In Your Cart!" });
        }
        const cartTemp = cartTemplate(availableProduct, authEmail, body === null || body === void 0 ? void 0 : body.productId, body === null || body === void 0 ? void 0 : body.listingId, body === null || body === void 0 ? void 0 : body.variationId);
        const result = yield db.collection('shoppingCarts').insertOne(cartTemp);
        const countCartItems = yield db.collection("shoppingCarts").countDocuments({ customerEmail: authEmail });
        if (result) {
            res.cookie("cart_p", countCartItems, { httpOnly: false, maxAge: 57600000 });
            return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });
        }
    }
    catch (error) {
        return res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.addCartAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const userEmail = req.decoded.email;
        let body = req.body;
        body['_SA_UID'] = Math.floor(Math.random() * 100000000);
        body['select_address'] = false;
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
