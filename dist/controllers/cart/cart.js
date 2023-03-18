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
const { findUserByEmail, actualSellingPrice, calculateShippingCost } = require("../../services/common.services");
module.exports.getCartContext = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const authEmail = req.decoded.email;
        let user = yield findUserByEmail(authEmail);
        if (!user) {
            return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
        }
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
                    package: 1,
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
                    p["shippingCharge"] = calculateShippingCost((_c = p === null || p === void 0 ? void 0 : p.package) === null || _c === void 0 ? void 0 : _c.volumetricWeight, areaType);
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
