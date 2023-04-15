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
const { findUserByEmail, update_variation_stock_available, actualSellingPrice, calculateShippingCost } = require("../../services/common.service");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");
const { generateOrderID, generateTrackingID } = require("../../utils/common");
module.exports = function SinglePurchaseOrder(req, res, next) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const authEmail = req.decoded.email;
            const uuid = req.decoded._uuid;
            const timestamp = Date.now();
            if (!req.body)
                throw new apiResponse.Api503Error("Service unavailable !");
            const { variationID, productID, quantity, listingID, paymentIntentID, state, paymentMethodID, orderPaymentID, customerEmail } = req.body;
            if (!variationID || !productID || !quantity || !listingID || !paymentIntentID || !state || !paymentMethodID || !orderPaymentID || !customerEmail)
                throw new apiResponse.Api400Error("Required variationID, productID, quantity, listingID, paymentIntentID, state, paymentMethodID, orderPaymentID, customerEmail");
            const user = yield findUserByEmail(authEmail);
            if (!user)
                throw new apiResponse.Api503Error("Service unavailable !");
            const defaultShippingAddress = (Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) &&
                ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
            const areaType = defaultShippingAddress === null || defaultShippingAddress === void 0 ? void 0 : defaultShippingAddress.area_type;
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
                            sellerEmail: '$sellerData.sellerEmail',
                            sellerID: "$sellerData.sellerID",
                            storeName: "$sellerData.storeName"
                        },
                        shipping: 1,
                        packaged: 1,
                        baseAmount: { $multiply: [actualSellingPrice, parseInt(quantity)] },
                        sellingPrice: actualSellingPrice,
                    }
                },
                {
                    $set: {
                        customerEmail: customerEmail,
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
            if (typeof product === 'undefined' || !Array.isArray(product))
                throw new apiResponse.Api503Error("Service unavailable !");
            product = product[0];
            product["orderID"] = generateOrderID();
            product["trackingID"] = generateTrackingID();
            product["shippingCharge"] = ((_c = product === null || product === void 0 ? void 0 : product.shipping) === null || _c === void 0 ? void 0 : _c.isFree) ? 0 : calculateShippingCost((_d = product === null || product === void 0 ? void 0 : product.packaged) === null || _d === void 0 ? void 0 : _d.volumetricWeight, areaType);
            product["baseAmount"] = parseInt((product === null || product === void 0 ? void 0 : product.baseAmount) + (product === null || product === void 0 ? void 0 : product.shippingCharge));
            product["orderAT"] = {
                iso: new Date(timestamp),
                time: new Date(timestamp).toLocaleTimeString(),
                date: new Date(timestamp).toDateString(),
                timestamp: timestamp
            };
            const result = yield Order.findOneAndUpdate({ user_email: authEmail }, { $push: { orders: product } }, { upsert: true });
            if (!result)
                throw new apiResponse.Api503Error("Service unavailable !");
            yield update_variation_stock_available("dec", { variationID, productID, quantity, listingID });
            authEmail && (yield email_service({
                to: authEmail,
                subject: "Order confirmed",
                html: buyer_order_email_template(product, product === null || product === void 0 ? void 0 : product.baseAmount)
            }));
            ((_e = product === null || product === void 0 ? void 0 : product.sellerData) === null || _e === void 0 ? void 0 : _e.sellerEmail) && (yield email_service({
                to: (_f = product === null || product === void 0 ? void 0 : product.sellerData) === null || _f === void 0 ? void 0 : _f.sellerEmail,
                subject: "New order confirmed",
                html: seller_order_email_template([product])
            }));
            return res.status(200).send({ success: true, statusCode: 200, message: "Order Success." });
        }
        catch (error) {
            next(error);
        }
    });
};
