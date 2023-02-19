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
const { cartTemplate } = require("../../templates/cart.template");
const { checkProductAvailability } = require("../../model/common.model");
const ShoppingCart = require("../../model/shoppingCart.model");
// add to cart controller
/**
 * @controller --> add product to cart
 * @required --> BODY [productID, variationID]
 * @request_method --> POST
 */
module.exports.addToCartHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        const body = req.body;
        let cart;
        const availableProduct = yield checkProductAvailability(body === null || body === void 0 ? void 0 : body.productID, body === null || body === void 0 ? void 0 : body.variationID);
        if (!availableProduct) {
            return res.status(503).send({ success: false, statusCode: 503, error: "Sorry! This product is out of stock now!" });
        }
        const cartTemp = cartTemplate(authEmail, body === null || body === void 0 ? void 0 : body.productID, body === null || body === void 0 ? void 0 : body.listingID, body === null || body === void 0 ? void 0 : body.variationID);
        if ((body === null || body === void 0 ? void 0 : body.action) === "toCart") {
            const existsProduct = yield ShoppingCart.findOne({ $and: [{ customerEmail: authEmail }, { variationID: body === null || body === void 0 ? void 0 : body.variationID }] });
            if (existsProduct) {
                return res.status(400).send({ success: false, statusCode: 400, error: "Product Has Already In Your Cart!" });
            }
            cart = new ShoppingCart(cartTemp);
            let result = yield cart.save();
            if (result === null || result === void 0 ? void 0 : result._id) {
                return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });
            }
        }
    }
    catch (error) {
        next(error);
    }
});
