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
const ShoppingCart = require("../model/SHOPPING_CART_TBL");
const { shopping_cart_pipe } = require("../utils/pipelines");
const Customer = require("../model/CUSTOMER_TBL");
const { cartContextCalculation } = require("../utils/common");
const { Error400 } = require("../res/response");
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
            const { _id: customerId, email } = req.decoded;
            const body = req.body;
            if (!body || typeof body !== "object")
                throw new Error400("Required body !");
            const customer = yield Customer.findOne({
                _id: ObjectId(customerId),
            });
            const { productId, sku, action, quantity } = body;
            if (action !== "toCart")
                throw new Error400("Required cart action !");
            if (!productId || !sku)
                throw new Error400("Required product id, sku in body !");
            const { stock, supplierId } = yield isProduct(productId, sku);
            if (stock !== "in")
                return res
                    .status(200)
                    .json({
                    success: true,
                    statusCode: 200,
                    message: "Sorry! This product currently out of stock.",
                });
            let existsProduct = yield ShoppingCart.findOne({
                $and: [
                    { customerId: ObjectId(customer === null || customer === void 0 ? void 0 : customer._id) },
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
                supplierId,
                quantity,
                customerId: customer === null || customer === void 0 ? void 0 : customer._id,
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
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, _id: customerId } = req.decoded;
            let cart;
            let customer = yield Customer.findOne({ _id: ObjectId(customerId) });
            const cartData = NodeCache.getCache(`${email}_cartProducts`);
            const uri = req === null || req === void 0 ? void 0 : req.get("Origin");
            if (cartData) {
                cart = cartData;
            }
            else {
                cart = yield ShoppingCart.aggregate(shopping_cart_pipe(customer === null || customer === void 0 ? void 0 : customer._id, uri));
                yield NodeCache.saveCache(`${email}_cartProducts`, cart);
            }
            const { amount, totalQuantity, shippingCost, finalAmount, savingAmount, discountShippingCost, } = cartContextCalculation(cart);
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
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req.decoded;
            const { productId, sku, cartId, quantity } = req === null || req === void 0 ? void 0 : req.body;
            if (!productId || !sku || !cartId)
                throw new Error400("Required product id, variation id, cart id !");
            if (!quantity || typeof quantity === "undefined")
                throw new Error400("Required quantity !");
            if (quantity > 5 || quantity <= 0)
                throw new Error400("Quantity can not greater than 5 and less than 1 !");
            const { stockQuantity } = yield isProduct(productId, sku);
            if (parseInt(quantity) >= stockQuantity) {
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
                            item.amount = item.sellPrice * quantity;
                            item.savingAmount = item.stockPrice - item.sellPrice;
                        }
                    });
                NodeCache.saveCache(`${email}_cartProducts`, cacheProduct);
            }
            const result = yield ShoppingCart.updateOne({
                $and: [
                    { _id: ObjectId(cartId) },
                    { productId: ObjectId(productId) },
                    { sku },
                ],
            }, {
                $set: { quantity: parseInt(quantity) },
            }, { upsert: true });
            if (!result)
                throw new Error("Failed to update quantity !");
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: `Quantity updated to ${quantity}.`,
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
function deleteCartItemSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { cartId } = req.params;
            const { email, _id: customerId } = req.decoded;
            if (!cartId)
                throw new Error400("Required cart id!");
            if (!ObjectId.isValid(cartId))
                throw new Error400("Cart id is not valid !");
            let deleted = yield ShoppingCart.deleteOne({
                $and: [{ _id: ObjectId(cartId) }, { customerId: ObjectId(customerId) }],
            });
            if (!deleted)
                throw new Error(`Internal server error!`);
            const cartInCached = NodeCache.getCache(`${email}_cartProducts`);
            if (cartInCached) {
                const filteredItems = cartInCached.filter((item) => (item === null || item === void 0 ? void 0 : item._id) !== cartId);
                NodeCache.saveCache(`${email}_cartProducts`, filteredItems);
            }
            // getting cart items from cache
            // NodeCache.deleteCache(`${email}_cartProducts`);
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
