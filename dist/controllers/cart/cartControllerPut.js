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
const { ObjectId } = require("mongodb");
const ShoppingCart = require("../../model/shoppingCart.model");
const User = require("../../model/user.model");
const apiResponse = require("../../errors/apiResponse");
const { checkProductAvailability } = require("../../services/common.service");
module.exports.updateCartProductQuantityController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const authEmail = req.decoded.email || "";
        const body = req.body;
        const cartType = (_a = body === null || body === void 0 ? void 0 : body.actionRequestContext) === null || _a === void 0 ? void 0 : _a.type;
        const upsertRequest = body === null || body === void 0 ? void 0 : body.upsertRequest;
        const cartContext = upsertRequest === null || upsertRequest === void 0 ? void 0 : upsertRequest.cartContext;
        const { productID, variationID, cartID, quantity } = cartContext;
        if (!productID || !variationID || !cartID)
            throw new apiResponse.Api400Error("Required product id, variation id, cart id !");
        if (!quantity || typeof quantity === "undefined")
            throw new apiResponse.Api400Error("Required quantity !");
        if (cartType !== 'toCart')
            throw new apiResponse.Api404Error("Required cart context !");
        let cartProduct = yield ShoppingCart.findOne({ $and: [{ customerEmail: authEmail }, { productID }, { _id: ObjectId(cartID) }] });
        if (!cartProduct)
            throw new apiResponse.Api404Error("Sorry product not found !");
        const productAvailability = yield checkProductAvailability(productID, variationID);
        if (!productAvailability || typeof productAvailability === "undefined" || productAvailability === null) {
            return res.status(400).send({ success: false, statusCode: 400, error: "Product not available" });
        }
        if (parseInt(quantity) >= ((_b = productAvailability === null || productAvailability === void 0 ? void 0 : productAvailability.variations) === null || _b === void 0 ? void 0 : _b.available)) {
            return res.status(200).send({ success: false, statusCode: 200, message: "Sorry ! your selected quantity out of range." });
        }
        cartProduct.quantity = parseInt(quantity);
        yield cartProduct.save();
        return res.status(200).send({ success: true, statusCode: 200, message: `Quantity updated to ${quantity}.` });
    }
    catch (error) {
        next(error);
    }
});
