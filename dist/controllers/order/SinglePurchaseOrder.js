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
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");
const apiResponse = require("../../errors/apiResponse");
const { findUserByEmail, update_variation_stock_available } = require("../../services/common.service");
const { calculateShippingCost } = require("../../utils/common");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");
const { generateItemID, generateOrderID } = require("../../utils/generator");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const OrderTableModel = require("../../model/orderTable.model");
const Order = require("../../model/order.model");
module.exports = function SinglePurchaseOrder(req, res, next) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, _uuid } = req.decoded;
            const timestamp = Date.now();
            if (!req.body)
                throw new apiResponse.Api503Error("Service unavailable !");
            const { variationID, productID, quantity, listingID, state, customerEmail } = req.body;
            if (!variationID || !productID || !quantity || !listingID || !state || !customerEmail)
                throw new apiResponse.Api400Error("Required variationID, productID, quantity, listingID, state, customerEmail");
            const user = yield findUserByEmail(email);
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
                        variations: 1,
                        supplier: 1,
                        shipping: 1,
                        packaged: 1,
                        product: {
                            title: "$variations.vTitle",
                            slug: "$slug",
                            brand: "$brand",
                            sku: "$variations.sku",
                            listing_id: "$items.listingID",
                            variation_id: "$items.variationID",
                            product_id: "$items.productID",
                            assets: {
                                $ifNull: [
                                    { $arrayElemAt: ["$options", { $indexOfArray: ["$options.color", "$variations.variant.color"] }] },
                                    null
                                ]
                            },
                            selling_price: "$variations.pricing.sellingPrice",
                            base_amount: { $multiply: ["$variations.pricing.sellingPrice", parseInt(quantity)] },
                        },
                    }
                },
                {
                    $set: {
                        "product.product_id": productID,
                        "product.listing_id": listingID,
                        "product.variation_id": variationID,
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
            const productInfos = [];
            product["shipping_charge"] = ((_c = product === null || product === void 0 ? void 0 : product.shipping) === null || _c === void 0 ? void 0 : _c.isFree) ? 0 : calculateShippingCost((((_d = product === null || product === void 0 ? void 0 : product.packaged) === null || _d === void 0 ? void 0 : _d.volumetricWeight) * (product === null || product === void 0 ? void 0 : product.quantity)), areaType);
            product["final_amount"] = parseInt(((_e = product === null || product === void 0 ? void 0 : product.product) === null || _e === void 0 ? void 0 : _e.base_amount) + (product === null || product === void 0 ? void 0 : product.shipping_charge));
            product["order_id"] = generateOrderID((_f = product === null || product === void 0 ? void 0 : product.supplier) === null || _f === void 0 ? void 0 : _f.id);
            product["payment"] = {
                status: "pending",
                mode: "card"
            };
            product["order_placed_at"] = {
                iso: new Date(timestamp),
                time: new Date(timestamp).toLocaleTimeString(),
                date: new Date(timestamp).toDateString(),
                timestamp: timestamp
            };
            product["state"] = state;
            product["customer"] = {
                id: _uuid,
                email,
                shipping_address: defaultShippingAddress
            };
            product["order_status"] = "placed";
            productInfos.push({
                productID: (_g = product === null || product === void 0 ? void 0 : product.product) === null || _g === void 0 ? void 0 : _g.product_id,
                listingID: (_h = product === null || product === void 0 ? void 0 : product.product) === null || _h === void 0 ? void 0 : _h.listing_id,
                variationID: (_j = product === null || product === void 0 ? void 0 : product.product) === null || _j === void 0 ? void 0 : _j.variation_id,
                quantity: product === null || product === void 0 ? void 0 : product.quantity
            });
            const totalAmount = product.final_amount || 0;
            // creating payment intents here
            const { client_secret, metadata, id } = yield stripe.paymentIntents.create({
                amount: (totalAmount * 100),
                currency: 'bdt',
                payment_method_types: ['card'],
                metadata: {
                    order_id: product === null || product === void 0 ? void 0 : product.order_id
                }
            });
            if (!client_secret)
                throw new apiResponse.Api400Error("Payment intent creation failed !");
            const orderTable = new Order(product);
            const result = yield orderTable.save();
            yield email_service({
                to: (_k = product === null || product === void 0 ? void 0 : product.supplier) === null || _k === void 0 ? void 0 : _k.email,
                subject: "New order confirmed",
                html: seller_order_email_template([product], email, [result === null || result === void 0 ? void 0 : result.orderID], totalAmount)
            });
            // after calculating total amount and order succeed then email sent to the buyer
            yield email_service({
                to: email,
                subject: "Order confirmed",
                html: buyer_order_email_template(product, totalAmount)
            });
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Order confirming soon..",
                totalAmount,
                clientSecret: client_secret,
                orderPaymentID: metadata === null || metadata === void 0 ? void 0 : metadata.order_id,
                paymentIntentID: id,
                orderIDs: [product === null || product === void 0 ? void 0 : product.order_id],
                productInfos
            });
        }
        catch (error) {
            next(error);
        }
    });
};
