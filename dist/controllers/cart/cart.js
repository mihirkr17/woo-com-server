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
const { actualSellingPriceProject, shoppingCartProject } = require("../../utils/projection");
const { findUserByEmail, checkProductAvailability, calculateShippingCost } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const { ObjectId } = require("mongodb");
const { cartTemplate } = require("../../templates/cart.template");
const Product = require("../../model/product.model");
const client = require("../../utils/redis");
// const redis = require("redis");
// const REDIS_PORT = process.env.PORT || 6379;
// const client = redis.createClient(REDIS_PORT);
// client.on("connect", function () {
//    console.log("Redis client connected");
// });
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
            yield client.del(`${authEmail}_cartProducts`);
            yield existsProduct.save();
            return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });
        }
        else {
            let shop = new ShoppingCart({
                customerEmail: authEmail,
                items: [cartTemp]
            });
            yield client.del(`${authEmail}_cartProducts`);
            yield shop.save();
            return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.getCartContext = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { email } = req.decoded;
        let cart;
        let areaType;
        let defaultShippingAddress;
        let user = yield findUserByEmail(email);
        if (!user)
            throw new apiResponse.Api500Error("Something wrong !");
        const cartData = yield client.get(`${email}_cartProducts`);
        if (cartData) {
            cart = JSON.parse(cartData);
        }
        else {
            console.log("Cart Fetching...");
            defaultShippingAddress = (Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) &&
                ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
            areaType = (defaultShippingAddress === null || defaultShippingAddress === void 0 ? void 0 : defaultShippingAddress.area_type) || "";
            cart = yield ShoppingCart.aggregate([
                { $match: { customerEmail: email } },
                { $unwind: { path: "$items" } },
                {
                    $lookup: {
                        from: 'products',
                        localField: "items.listingID",
                        foreignField: "_lid",
                        as: "main_product"
                    }
                },
                { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
                { $project: { main_product: 0 } },
                { $unwind: { path: "$variations" } },
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$variations._vrid', '$items.variationID'] },
                                { $eq: ["$variations.stock", "in"] },
                                { $eq: ["$variations.status", "active"] },
                                { $eq: ["$save_as", "fulfilled"] }
                            ]
                        }
                    }
                },
                {
                    $project: shoppingCartProject
                },
                {
                    $unset: ["variations", "items"]
                }
            ]);
            yield client.set(`${email}_cartProducts`, JSON.stringify(cart));
        }
        if (typeof cart === "object") {
            cart && cart.map((p) => {
                var _a, _b, _c;
                if (((_a = p === null || p === void 0 ? void 0 : p.shipping) === null || _a === void 0 ? void 0 : _a.isFree) && ((_b = p === null || p === void 0 ? void 0 : p.shipping) === null || _b === void 0 ? void 0 : _b.isFree)) {
                    p["shippingCharge"] = 0;
                }
                else {
                    p["shippingCharge"] = calculateShippingCost((((_c = p === null || p === void 0 ? void 0 : p.packaged) === null || _c === void 0 ? void 0 : _c.volumetricWeight) * (p === null || p === void 0 ? void 0 : p.quantity)), areaType);
                }
                return p;
            });
            const baseAmounts = cart && cart.map((tAmount) => (parseInt(tAmount === null || tAmount === void 0 ? void 0 : tAmount.baseAmount))).reduce((p, c) => p + c, 0);
            const totalQuantities = cart && cart.map((tQuant) => (parseInt(tQuant === null || tQuant === void 0 ? void 0 : tQuant.quantity))).reduce((p, c) => p + c, 0);
            const shippingFees = cart && cart.map((p) => parseInt(p === null || p === void 0 ? void 0 : p.shippingCharge)).reduce((p, c) => p + c, 0);
            const finalAmounts = cart && cart.map((fAmount) => (parseInt(fAmount === null || fAmount === void 0 ? void 0 : fAmount.baseAmount) + (fAmount === null || fAmount === void 0 ? void 0 : fAmount.shippingCharge))).reduce((p, c) => p + c, 0);
            const savingAmounts = cart && cart.map((fAmount) => (parseInt(fAmount === null || fAmount === void 0 ? void 0 : fAmount.savingAmount))).reduce((p, c) => p + c, 0);
            let shoppingCartData = {
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
            };
            return res.status(200).send({ success: true, statusCode: 200, data: { module: shoppingCartData } });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.updateCartProductQuantityController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const authEmail = req.decoded.email || "";
        const body = req.body;
        const cartType = (_c = body === null || body === void 0 ? void 0 : body.actionRequestContext) === null || _c === void 0 ? void 0 : _c.type;
        const upsertRequest = body === null || body === void 0 ? void 0 : body.upsertRequest;
        const cartContext = upsertRequest === null || upsertRequest === void 0 ? void 0 : upsertRequest.cartContext;
        const { productID, variationID, cartID, quantity } = cartContext;
        if (!productID || !variationID || !cartID)
            throw new apiResponse.Api400Error("Required product id, variation id, cart id !");
        if (!quantity || typeof quantity === "undefined")
            throw new apiResponse.Api400Error("Required quantity !");
        if (quantity > 5 || quantity <= 0)
            throw new apiResponse.Api400Error("Quantity can not greater than 5 and less than 1 !");
        if (cartType !== 'toCart')
            throw new apiResponse.Api404Error("Invalid cart context !");
        const productAvailability = yield checkProductAvailability(productID, variationID);
        if (!productAvailability || typeof productAvailability === "undefined" || productAvailability === null)
            throw new apiResponse.Api400Error("Product is available !");
        if (parseInt(quantity) >= ((_d = productAvailability === null || productAvailability === void 0 ? void 0 : productAvailability.variations) === null || _d === void 0 ? void 0 : _d.available)) {
            return res.status(200).send({ success: false, statusCode: 200, message: "Sorry ! your selected quantity out of range." });
        }
        let getCart = yield client.get(`${authEmail}_cartProducts`);
        getCart = JSON.parse(getCart);
        if (!getCart) {
            console.log("Quantity updating...");
            const result = yield ShoppingCart.findOneAndUpdate({ $and: [{ customerEmail: authEmail }, { _id: ObjectId(cartID) }] }, {
                $set: { "items.$[i].quantity": parseInt(quantity) }
            }, { arrayFilters: [{ "i.variationID": variationID }], upsert: true });
            if (result)
                return res.status(200).send({ success: true, statusCode: 200, message: `Quantity updated to ${quantity}.` });
            throw new apiResponse.Api500Error("Failed to update quantity !");
        }
        let product = getCart.find((e) => (e === null || e === void 0 ? void 0 : e.variationID) === variationID);
        let productIndex = getCart.findIndex((e) => (e === null || e === void 0 ? void 0 : e.variationID) === variationID);
        getCart[productIndex].quantity = quantity;
        getCart[productIndex].baseAmount = product.sellingPrice * quantity;
        getCart[productIndex].savingAmount = (product.price - product.sellingPrice);
        yield client.set(`${authEmail}_cartProducts`, JSON.stringify(getCart), "EX", 60);
        return res.status(200).send({ success: true, statusCode: 200, message: `Quantity updated to ${quantity}.` });
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
        const productID = req.params.productID;
        const variationID = req.query.vr;
        const authEmail = req.decoded.email;
        const cart_types = req.params.cartTypes;
        if (!variationID || !productID)
            throw new apiResponse.Api400Error("Required product id & variation id !");
        if (!ObjectId.isValid(productID))
            throw new apiResponse.Api400Error("Product id is not valid !");
        if (cart_types !== "toCart")
            throw new apiResponse.Api500Error("Invalid cart type !");
        let updateDocuments = yield ShoppingCart.findOneAndUpdate({ customerEmail: authEmail }, {
            $pull: { items: { $and: [{ variationID }, { productID }] } }
        });
        let cartProducts = yield client.get(`${authEmail}_cartProducts`);
        cartProducts = cartProducts && JSON.parse(cartProducts);
        cartProducts = cartProducts.filter((e) => (e === null || e === void 0 ? void 0 : e.variationID) !== variationID);
        yield client.set(`${authEmail}_cartProducts`, JSON.stringify(cartProducts));
        if (updateDocuments)
            return res.status(200).send({ success: true, statusCode: 200, message: "Item removed successfully from your cart." });
        throw new apiResponse.Api500Error("Failed to delete product from cart !");
    }
    catch (error) {
        next(error);
    }
});
