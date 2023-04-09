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
const { findUserByEmail, checkProductAvailability, actualSellingPrice, calculateShippingCost } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const { ObjectId } = require("mongodb");
const { cartTemplate } = require("../../templates/cart.template");
/**
 * @apiController --> ADD PRODUCT IN CART
 * @apiMethod --> POST
 */
module.exports.addToCartHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        const body = req.body;
        let cart;
        if (!body || typeof body !== "object")
            throw new apiResponse.Api400Error("Required body !");
        const { productID, variationID, listingID, action } = body;
        if (!productID || !variationID || !listingID)
            throw new apiResponse.Api400Error("Required product id, listing id, variation id in body !");
        const availableProduct = yield checkProductAvailability(productID, variationID);
        if (!availableProduct)
            throw new apiResponse.Api404Error("Product is not available !");
        const cartTemp = cartTemplate(authEmail, productID, listingID, variationID);
        if (action === "toCart") {
            const existsProduct = yield ShoppingCart.countDocuments({ $and: [{ customerEmail: authEmail }, { variationID: variationID }] });
            if (existsProduct >= 1)
                throw new apiResponse.Api400Error("Product has already in your cart !");
            cart = new ShoppingCart(cartTemp);
            let result = yield cart.save();
            if (result === null || result === void 0 ? void 0 : result._id) {
                return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });
            }
            throw new apiResponse.Api500Error("Something wrong !");
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.getCartContext = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const authEmail = req.decoded.email;
        let user = yield findUserByEmail(authEmail);
        if (!user)
            throw new apiResponse.Api500Error("Something wrong !");
        let defaultShippingAddress = (Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) &&
            ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
        let areaType = (defaultShippingAddress === null || defaultShippingAddress === void 0 ? void 0 : defaultShippingAddress.area_type) || "";
        const cart = yield ShoppingCart.aggregate([
            { $match: { customerEmail: authEmail } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'listingID',
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
                            { $eq: ['$variations._vrid', '$variationID'] },
                            { $eq: ["$variations.stock", "in"] },
                            { $eq: ["$variations.status", "active"] },
                            { $eq: ["$save_as", "fulfilled"] }
                        ]
                    }
                }
            },
            {
                $project: {
                    cartID: "$_id",
                    dim: 1,
                    _id: 0,
                    title: "$variations.vTitle",
                    slug: 1,
                    packaged: 1,
                    listingID: 1,
                    productID: 1,
                    customerEmail: 1,
                    variationID: 1,
                    variations: 1,
                    shipping: 1,
                    brand: 1,
                    image: { $first: "$images" },
                    sku: "$variations.sku",
                    sellerData: 1,
                    quantity: 1,
                    savingAmount: { $multiply: [{ $subtract: ["$pricing.price", actualSellingPrice] }, '$quantity'] },
                    baseAmount: { $multiply: [actualSellingPrice, '$quantity'] },
                    paymentInfo: 1,
                    sellingPrice: actualSellingPrice,
                    variant: "$variations.variant",
                    available: "$variations.available",
                    stock: "$variations.stock"
                }
            },
            {
                $unset: ["variations"]
            }
        ]);
        if (typeof cart === "object") {
            cart && cart.map((p) => {
                var _a, _b, _c;
                if (((_a = p === null || p === void 0 ? void 0 : p.shipping) === null || _a === void 0 ? void 0 : _a.isFree) && ((_b = p === null || p === void 0 ? void 0 : p.shipping) === null || _b === void 0 ? void 0 : _b.isFree)) {
                    p["shippingCharge"] = 0;
                }
                else {
                    p["shippingCharge"] = calculateShippingCost((_c = p === null || p === void 0 ? void 0 : p.packaged) === null || _c === void 0 ? void 0 : _c.volumetricWeight, areaType);
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
        if (cartType !== 'toCart')
            throw new apiResponse.Api404Error("Required cart context !");
        let cartProduct = yield ShoppingCart.findOne({ $and: [{ customerEmail: authEmail }, { productID }, { _id: ObjectId(cartID) }] });
        if (!cartProduct)
            throw new apiResponse.Api404Error("Sorry product not found !");
        const productAvailability = yield checkProductAvailability(productID, variationID);
        if (!productAvailability || typeof productAvailability === "undefined" || productAvailability === null)
            throw new apiResponse.Api400Error("Product is available !");
        if (parseInt(quantity) >= ((_d = productAvailability === null || productAvailability === void 0 ? void 0 : productAvailability.variations) === null || _d === void 0 ? void 0 : _d.available)) {
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
/**
 * @apiController --> DELETE PRODUCT FROM CART
 * @apiMethod --> DELETE
 * @apiRequired --> product id & variation id
 */
module.exports.deleteCartItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productID = req.headers.authorization;
        const variationID = req.query.vr;
        const authEmail = req.decoded.email;
        const cart_types = req.params.cartTypes;
        let updateDocuments;
        if (!variationID || !productID)
            throw new apiResponse.Api400Error("Required product id & variation id !");
        if (!ObjectId.isValid(productID))
            throw new apiResponse.Api400Error("Product id is not valid !");
        if (cart_types === "toCart") {
            updateDocuments = yield ShoppingCart.deleteOne({ $and: [{ customerEmail: authEmail }, { productID }, { variationID }] });
        }
        if (updateDocuments) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Item removed successfully from your cart." });
        }
        throw new apiResponse.Api500Error("Failed to delete product from cart !");
    }
    catch (error) {
        next(error);
    }
});
