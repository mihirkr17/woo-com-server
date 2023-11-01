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
const ShoppingCart = require("../model/shoppingCart.model");
const { shopping_cart_pipe } = require("../utils/pipelines");
const User = require("../model/user.model");
const Customer = require("../model/customer.model");
const { cartContextCalculation } = require("../utils/common");
const { Api400Error, Api404Error } = require("../errors/apiResponse");
const { ObjectId } = require("mongodb");
const NodeCache = require("../utils/NodeCache");
const ProductService = require("../services/ProductService");
const { isProduct } = new ProductService();
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function addToCartSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id, email } = req.decoded;
            const body = req.body;
            if (!body || typeof body !== "object")
                throw new Api400Error("Required body !");
            const { productId, sku, action, quantity } = body;
            if (!productId || !sku)
                throw new Api400Error("Required product id, listing id, variation id in body !");
            const availableProduct = yield isProduct(productId, sku);
            if (!availableProduct)
                throw new Api404Error("Product is not available !");
            if (action !== "toCart")
                throw new Api400Error("Required cart operation !");
            let existsProduct = yield ShoppingCart.findOne({
                $and: [
                    { customerId: ObjectId(_id) },
                    { sku },
                    { productId: ObjectId(productId) },
                ],
            });
            if (existsProduct)
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "This product already in your cart.",
                });
            const cart = new ShoppingCart({
                productId,
                sku,
                quantity,
                customerId: _id,
                addedAt: new Date(),
            });
            const result = yield cart.save();
            NodeCache.deleteCache(`${email}_cartProducts`);
            if (!result)
                throw new Error("Internal Server Error !");
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Product successfully added to your cart.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function getCartContextSystem(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, _id } = req.decoded;
            let cart;
            let user = yield Customer.findOne({ userId: ObjectId(_id) });
            const cartData = NodeCache.getCache(`${email}_cartProducts`);
            if (cartData) {
                cart = cartData;
            }
            else {
                cart = yield ShoppingCart.aggregate(shopping_cart_pipe(_id));
                yield NodeCache.saveCache(`${email}_cartProducts`, cart);
            }
            const { amount, totalQuantity, shippingCost, finalAmount, savingAmount, discountShippingCost, } = cartContextCalculation(cart);
            const defaultShippingAddress = (_a = user === null || user === void 0 ? void 0 : user.shippingAddress) === null || _a === void 0 ? void 0 : _a.find((adr) => adr.default_shipping_address === true);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                data: {
                    module: {
                        cartItems: cart,
                        cartCalculation: {
                            amount,
                            totalQuantity,
                            finalAmount,
                            shippingCost,
                            savingAmount,
                            discountShippingCost,
                        },
                        numberOfProduct: cart.length || 0,
                        defaultShippingAddress,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function updateCartProductQuantitySystem(req, res, next) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, _id } = req.decoded;
            const { type } = (_a = req === null || req === void 0 ? void 0 : req.body) === null || _a === void 0 ? void 0 : _a.actionRequestContext;
            const { productID, sku, cartID, quantity } = (_c = (_b = req === null || req === void 0 ? void 0 : req.body) === null || _b === void 0 ? void 0 : _b.upsertRequest) === null || _c === void 0 ? void 0 : _c.cartContext;
            if (!productID || !sku || !cartID)
                throw new Api400Error("Required product id, variation id, cart id !");
            if (!quantity || typeof quantity === "undefined")
                throw new Api400Error("Required quantity !");
            if (quantity > 5 || quantity <= 0)
                throw new Api400Error("Quantity can not greater than 5 and less than 1 !");
            if (type !== "toCart")
                throw new Api404Error("Invalid cart context !");
            const productAvailability = yield isProduct(productID, sku);
            if (!productAvailability ||
                typeof productAvailability === "undefined" ||
                productAvailability === null)
                throw new Api400Error("Product is available !");
            if (parseInt(quantity) >= ((_d = productAvailability === null || productAvailability === void 0 ? void 0 : productAvailability.variations) === null || _d === void 0 ? void 0 : _d.available)) {
                return res.status(200).send({
                    success: false,
                    statusCode: 200,
                    message: "Sorry ! your selected quantity out of range.",
                });
            }
            let cacheProduct = NodeCache.getCache(`${email}_cartProducts`);
            // if cart has cache then some operation
            if (cacheProduct) {
                Array.isArray(cacheProduct) &&
                    cacheProduct.forEach((item) => {
                        if ((item === null || item === void 0 ? void 0 : item.sku) === sku) {
                            item.quantity = quantity;
                            item.amount = item.sellingPrice * quantity;
                            item.savingAmount = item.price - item.sellingPrice;
                        }
                    });
                NodeCache.saveCache(`${email}_cartProducts`, cacheProduct);
            }
            const result = yield ShoppingCart.findOneAndUpdate({
                $and: [
                    { customerId: ObjectId(_id) },
                    { productId: ObjectId(productID) },
                    { sku },
                ],
            }, {
                $set: { quantity: parseInt(quantity) },
            }, { upsert: true });
            if (result)
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: `Quantity updated to ${quantity}.`,
                });
            throw new Error("Failed to update quantity !");
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function deleteCartItemSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { productID, sku, cartTypes } = req.params;
            const { email, _id } = req.decoded;
            if (!sku || !productID)
                throw new Api400Error("Required product id & sku !");
            if (!ObjectId.isValid(productID))
                throw new Api400Error("Product id is not valid !");
            if (cartTypes !== "toCart")
                throw new Error("Invalid cart type !");
            let deleted = yield ShoppingCart.findOneAndDelete({
                $and: [
                    { customerId: ObjectId(_id) },
                    { productId: ObjectId(productID) },
                    { sku },
                ],
            });
            if (!deleted)
                throw new Error(`Couldn't delete product with sku ${sku}!`);
            // getting cart items from cache
            NodeCache.deleteCache(`${email}_cartProducts`);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Item removed successfully from your cart.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
module.exports = {
    addToCartSystem,
    getCartContextSystem,
    updateCartProductQuantitySystem,
    deleteCartItemSystem,
};
