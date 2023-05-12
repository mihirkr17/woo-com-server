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
const ShoppingCart = require("../../model/shoppingCart.model");
const { shopping_cart_pipe } = require("../../utils/pipelines");
const { findUserByEmail, checkProductAvailability, calculateShippingCost } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const { ObjectId } = require("mongodb");
const { cartTemplate } = require("../../templates/cart.template");
const NodeCache = require("node-cache");
const nCache = new NodeCache({ stdTTL: 600 });
/**
 * @apiController --> ADD PRODUCT IN CART
 * @apiMethod --> POST
 */
module.exports.addToCartHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        const body = req.body;
        if (!body || typeof body !== "object")
            throw new apiResponse.Api400Error("Required body !");
        const { productID, variationID, listingID, action } = body;
        if (!productID || !variationID || !listingID)
            throw new apiResponse.Api400Error("Required product id, listing id, variation id in body !");
        const availableProduct = yield checkProductAvailability(productID, variationID);
        if (!availableProduct)
            throw new apiResponse.Api404Error("Product is not available !");
        const cartTemp = cartTemplate(productID, listingID, variationID);
        if (action !== "toCart")
            throw new apiResponse.Api400Error("Required cart operation !");
        let existsProduct = yield ShoppingCart.findOne({ customerEmail: authEmail });
        if (existsProduct) {
            let items = (Array.isArray(existsProduct.items) && existsProduct.items) || [];
            let isExist = items.some((e) => e.variationID === variationID);
            if (isExist)
                throw new apiResponse.Api400Error("Product has already in your cart !");
            existsProduct.items = [...items, cartTemp];
            nCache.del(`${authEmail}_cartProducts`);
            yield existsProduct.save();
            return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });
        }
        else {
            let shop = new ShoppingCart({
                customerEmail: authEmail,
                items: [cartTemp]
            });
            nCache.del(`${authEmail}_cartProducts`);
            yield shop.save();
            return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.getCartContext = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { email } = req.decoded;
        let cart;
        let user = yield findUserByEmail(email);
        if (!user || (user === null || user === void 0 ? void 0 : user.role) !== "BUYER")
            throw new apiResponse.Api401Error("Permission denied !");
        const cartData = nCache.get(`${email}_cartProducts`);
        if (cartData) {
            cart = JSON.parse(cartData);
        }
        else {
            cart = yield ShoppingCart.aggregate(shopping_cart_pipe(email));
            yield nCache.set(`${email}_cartProducts`, JSON.stringify(cart), 60000);
        }
        // declare cart calculation variables 
        let baseAmounts = 0;
        let totalQuantities = 0;
        let shippingFees = 0;
        let finalAmounts = 0;
        let savingAmounts = 0;
        const defaultShippingAddress = (_b = (_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) === null || _b === void 0 ? void 0 : _b.find((adr) => adr.default_shipping_address === true);
        const areaType = (_c = defaultShippingAddress === null || defaultShippingAddress === void 0 ? void 0 : defaultShippingAddress.area_type) !== null && _c !== void 0 ? _c : "";
        if (typeof cart === "object" && cart.length >= 1) {
            cart.forEach((p) => {
                var _a, _b, _c;
                if (((_a = p === null || p === void 0 ? void 0 : p.shipping) === null || _a === void 0 ? void 0 : _a.isFree) && ((_b = p === null || p === void 0 ? void 0 : p.shipping) === null || _b === void 0 ? void 0 : _b.isFree)) {
                    p["shippingCharge"] = 0;
                }
                else {
                    p["shippingCharge"] = calculateShippingCost((((_c = p === null || p === void 0 ? void 0 : p.packaged) === null || _c === void 0 ? void 0 : _c.volumetricWeight) * (p === null || p === void 0 ? void 0 : p.quantity)), areaType);
                }
                baseAmounts += p === null || p === void 0 ? void 0 : p.baseAmount;
                totalQuantities += p === null || p === void 0 ? void 0 : p.quantity;
                shippingFees += p === null || p === void 0 ? void 0 : p.shippingCharge;
                finalAmounts += (parseInt(p === null || p === void 0 ? void 0 : p.baseAmount) + (p === null || p === void 0 ? void 0 : p.shippingCharge));
                savingAmounts += p === null || p === void 0 ? void 0 : p.savingAmount;
            });
        }
        return res.status(200).send({
            success: true, statusCode: 200, data: {
                module: {
                    products: cart,
                    container_p: {
                        baseAmounts,
                        totalQuantities,
                        finalAmounts,
                        shippingFees,
                        savingAmounts
                    },
                    numberOfProducts: cart.length || 0,
                    defaultShippingAddress
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
module.exports.updateCartProductQuantityController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f, _g;
    try {
        const { email } = req.decoded;
        const { type } = (_d = req === null || req === void 0 ? void 0 : req.body) === null || _d === void 0 ? void 0 : _d.actionRequestContext;
        const { productID, variationID, cartID, quantity } = (_f = (_e = req === null || req === void 0 ? void 0 : req.body) === null || _e === void 0 ? void 0 : _e.upsertRequest) === null || _f === void 0 ? void 0 : _f.cartContext;
        if (!productID || !variationID || !cartID)
            throw new apiResponse.Api400Error("Required product id, variation id, cart id !");
        if (!quantity || typeof quantity === "undefined")
            throw new apiResponse.Api400Error("Required quantity !");
        if (quantity > 5 || quantity <= 0)
            throw new apiResponse.Api400Error("Quantity can not greater than 5 and less than 1 !");
        if (type !== 'toCart')
            throw new apiResponse.Api404Error("Invalid cart context !");
        const productAvailability = yield checkProductAvailability(productID, variationID);
        if (!productAvailability || typeof productAvailability === "undefined" || productAvailability === null)
            throw new apiResponse.Api400Error("Product is available !");
        if (parseInt(quantity) >= ((_g = productAvailability === null || productAvailability === void 0 ? void 0 : productAvailability.variations) === null || _g === void 0 ? void 0 : _g.available)) {
            return res.status(200).send({ success: false, statusCode: 200, message: "Sorry ! your selected quantity out of range." });
        }
        let getCart = nCache.get(`${email}_cartProducts`);
        // if cart has cache then some operation 
        if (getCart) {
            getCart = JSON.parse(getCart);
            let product = getCart.find((e) => (e === null || e === void 0 ? void 0 : e.variationID) === variationID);
            let productIndex = getCart.findIndex((e) => (e === null || e === void 0 ? void 0 : e.variationID) === variationID);
            getCart[productIndex].quantity = quantity;
            getCart[productIndex].baseAmount = product.sellingPrice * quantity;
            getCart[productIndex].savingAmount = (product.price - product.sellingPrice);
            nCache.set(`${email}_cartProducts`, JSON.stringify(getCart), 60000);
        }
        const result = yield ShoppingCart.findOneAndUpdate({ $and: [{ customerEmail: email }, { _id: ObjectId(cartID) }] }, {
            $set: { "items.$[i].quantity": parseInt(quantity) }
        }, { arrayFilters: [{ "i.variationID": variationID }], upsert: true });
        if (result)
            return res.status(200).send({ success: true, statusCode: 200, message: `Quantity updated to ${quantity}.` });
        throw new apiResponse.Api500Error("Failed to update quantity !");
    }
    catch (error) {
        next(error);
    }
});
/**
 * @apiController --> DELETE PRODUCT FROM CART
 * @apiMethod --> DELETE
 * @apiRequired --> product id & variation id
 */
module.exports.deleteCartItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productID, variationID, cartTypes } = req.params;
        const { email } = req.decoded;
        if (!variationID || !productID)
            throw new apiResponse.Api400Error("Required product id & variation id !");
        if (!ObjectId.isValid(productID))
            throw new apiResponse.Api400Error("Product id is not valid !");
        if (cartTypes !== "toCart")
            throw new apiResponse.Api500Error("Invalid cart type !");
        let deleted = yield ShoppingCart.findOneAndUpdate({ customerEmail: email }, {
            $pull: { items: { $and: [{ variationID }, { productID }] } }
        });
        if (!deleted)
            throw new apiResponse.Api500Error(`Couldn't delete product with variation id ${variationID}!`);
        // getting cart items from cache
        let cartProductsInCache = nCache.get(`${email}_cartProducts`);
        if (cartProductsInCache) {
            cartProductsInCache = JSON.parse(cartProductsInCache);
            nCache.set(`${email}_cartProducts`, JSON.stringify(Array.isArray(cartProductsInCache) && cartProductsInCache.filter((e) => (e === null || e === void 0 ? void 0 : e.variationID) !== variationID)));
        }
        return res.status(200).send({ success: true, statusCode: 200, message: "Item removed successfully from your cart." });
    }
    catch (error) {
        next(error);
    }
});
