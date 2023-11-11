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
const Customer = require("../model/CUSTOMER_TBL");
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
            const { _id: userId, email } = req.decoded;
            const body = req.body;
            if (!body || typeof body !== "object")
                throw new Api400Error("Required body !");
            const customer = yield Customer.findOne({
                userId: ObjectId(userId),
            });
            if (!(customer === null || customer === void 0 ? void 0 : customer.userId)) {
                const newCustomer = new Customer({
                    _id: new ObjectId(),
                    userId,
                });
                yield newCustomer.save();
            }
            const { productId, sku, action, quantity } = body;
            if (!productId || !sku)
                throw new Api400Error("Required product id, listing id, variation id in body !");
            const { storeId, storeTitle, brand } = yield isProduct(productId, sku);
            if (!storeId)
                throw new Api404Error("Product is not available !");
            if (action !== "toCart")
                throw new Api400Error("Required cart operation !");
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
                userId,
                productId,
                sku,
                brand,
                storeId,
                storeTitle,
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
            const { email, _id: userId } = req.decoded;
            let cart;
            let customer = yield Customer.findOne({ userId: ObjectId(userId) });
            const cartData = NodeCache.getCache(`${email}_cartProducts`);
            if (cartData) {
                cart = cartData;
            }
            else {
                cart = yield ShoppingCart.aggregate(shopping_cart_pipe(customer === null || customer === void 0 ? void 0 : customer._id));
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
                throw new Api400Error("Required product id, variation id, cart id !");
            if (!quantity || typeof quantity === "undefined")
                throw new Api400Error("Required quantity !");
            if (quantity > 5 || quantity <= 0)
                throw new Api400Error("Quantity can not greater than 5 and less than 1 !");
            const productAvailability = yield isProduct(productId, sku);
            if (!productAvailability ||
                typeof productAvailability === "undefined" ||
                productAvailability === null)
                throw new Api400Error("Product is not available !");
            if (parseInt(quantity) >= (productAvailability === null || productAvailability === void 0 ? void 0 : productAvailability.stockQuantity)) {
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
            const { email, _id: userId } = req.decoded;
            if (!cartId)
                throw new Api400Error("Required cart id!");
            if (!ObjectId.isValid(cartId))
                throw new Api400Error("Product id is not valid !");
            let deleted = yield ShoppingCart.deleteOne({
                $and: [{ _id: ObjectId(cartId) }, { userId: ObjectId(userId) }],
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
