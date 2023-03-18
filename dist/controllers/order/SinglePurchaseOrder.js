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
const Order = require("../../model/order.model");
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");
const apiResponse = require("../../errors/apiResponse");
const { findUserByEmail, update_variation_stock_available, actualSellingPrice, calculateShippingCost } = require("../../services/common.services");
module.exports = function SinglePurchaseOrder(req, res, next) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const authEmail = req.decoded.email;
            const body = req.body;
            const uuid = req.decoded._uuid;
            if (!body) {
                return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
            }
            const { variationID, productID, quantity, listingID, paymentIntentID, state, paymentMethodID, orderPaymentID, customerEmail } = body;
            let user = yield findUserByEmail(authEmail);
            if (!user) {
                return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
            }
            let defaultShippingAddress = (Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) &&
                ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
            let areaType = defaultShippingAddress === null || defaultShippingAddress === void 0 ? void 0 : defaultShippingAddress.area_type;
            let product = yield Product.aggregate([
                { $match: { $and: [{ _lid: listingID }, { _id: ObjectId(productID) }] } },
                { $unwind: { path: "$variations" } },
                { $match: { $and: [{ 'variations._vrid': variationID }] } },
                {
                    $project: {
                        _id: 0,
                        title: "$variations.vTitle",
                        slug: 1,
                        variations: 1,
                        brand: 1,
                        image: { $first: "$images" },
                        sku: "$variations.sku",
                        sellerData: {
                            sellerID: "$sellerData.sellerID",
                            storeName: "$sellerData.storeName"
                        },
                        shipping: 1,
                        package: 1,
                        baseAmount: { $multiply: [actualSellingPrice, parseInt(quantity)] },
                        sellingPrice: actualSellingPrice,
                    }
                },
                {
                    $set: {
                        paymentMode: "card",
                        state: state,
                        shippingAddress: defaultShippingAddress,
                        paymentStatus: "success",
                        customerID: uuid,
                        orderStatus: "pending",
                        paymentIntentID: paymentIntentID,
                        paymentMethodID: paymentMethodID,
                        orderPaymentID: orderPaymentID,
                        productID: productID,
                        listingID: listingID,
                        variationID: variationID,
                        quantity: quantity
                    }
                },
                {
                    $unset: ["variations"]
                }
            ]);
            if (product && typeof product !== 'undefined') {
                product = product[0];
                product["customerEmail"] = customerEmail;
                product["orderID"] = "oi_" + (Math.floor(10000000 + Math.random() * 999999999999)).toString();
                product["trackingID"] = "tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString();
                if (((_c = product === null || product === void 0 ? void 0 : product.shipping) === null || _c === void 0 ? void 0 : _c.isFree) && ((_d = product === null || product === void 0 ? void 0 : product.shipping) === null || _d === void 0 ? void 0 : _d.isFree)) {
                    product["shippingCharge"] = 0;
                }
                else {
                    product["shippingCharge"] = calculateShippingCost((_e = product === null || product === void 0 ? void 0 : product.package) === null || _e === void 0 ? void 0 : _e.volumetricWeight, areaType);
                }
                let amountNew = (product === null || product === void 0 ? void 0 : product.baseAmount) + (product === null || product === void 0 ? void 0 : product.shippingCharge);
                product["baseAmount"] = parseInt(amountNew);
                const timestamp = Date.now();
                product["orderAT"] = {
                    iso: new Date(timestamp),
                    time: new Date(timestamp).toLocaleTimeString(),
                    date: new Date(timestamp).toDateString(),
                    timestamp: timestamp
                };
                let result = yield Order.findOneAndUpdate({ user_email: authEmail }, { $push: { orders: product } }, { upsert: true });
                if (result) {
                    yield update_variation_stock_available("dec", { variationID, productID, quantity, listingID });
                    return res.status(200).send({ success: true, statusCode: 200, message: "Order Success." });
                }
            }
        }
        catch (error) {
            next(error);
        }
    });
};
