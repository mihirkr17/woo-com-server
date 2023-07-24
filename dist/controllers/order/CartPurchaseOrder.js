"use strict";
// src/controllers/order/CartPurchaseOrder.tsx
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
const apiResponse = require("../../errors/apiResponse");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const ShoppingCart = require("../../model/shoppingCart.model");
const { findUserByEmail } = require("../../services/common.service");
const { calculateShippingCost } = require("../../utils/common");
const OrderTableModel = require("../../model/orderTable.model");
const { generateItemID, generateOrderID } = require("../../utils/generator");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");
const Order = require("../../model/order.model");
/**
 * Handles the purchase of items from the cart and creates orders.
 *
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<Response>} The HTTP response indicating the status of the order creation.
 * @throws {Api400Error} If required request body is missing.
 * @throws {Api401Error} If the customer email is unauthorized.
 * @throws {Api400Error} If the user is not found with the provided email.
 * @throws {Api400Error} If the required shipping address is missing.
 * @throws {Api400Error} If there are no items in the cart.
 * @throws {Api503Error} If the service is unavailable.
 * @throws {Api400Error} If the payment intent creation fails.
 * @throws {Api400Error} If the order processing fails.
 */
function createPaymentIntents(totalAmount, orderIDs) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Creating payment intent after getting total amount of order items. 
            const paymentIntents = yield stripe.paymentIntents.create({
                amount: (totalAmount * 100),
                currency: 'bdt',
                payment_method_types: ['card'],
                metadata: {
                    order_id: orderIDs.join(", ")
                }
            });
            return paymentIntents;
        }
        catch (e) {
            switch (e.type) {
                case 'StripeCardError':
                    throw new apiResponse.Api400Error(`A payment error occurred: ${e.message}`);
                    break;
                case 'StripeInvalidRequestError':
                    console.log('An invalid request occurred.');
                    break;
                default:
                    console.log('Another problem occurred, maybe unrelated to Stripe.');
                    break;
            }
        }
    });
}
module.exports = function CartPurchaseOrder(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, _uuid } = req.decoded;
            // initialized current time stamp
            const timestamp = Date.now();
            const timeObject = {
                iso: new Date(timestamp),
                time: new Date(timestamp).toLocaleTimeString(),
                date: new Date(timestamp).toDateString(),
                timestamp: timestamp
            };
            if (!req.body || typeof req.body === "undefined")
                throw new apiResponse.Api400Error("Required body !");
            // get state by body
            const { state, customerEmail } = req.body;
            if (customerEmail !== email)
                throw new apiResponse.Api401Error("Unauthorized access !");
            // finding user by email;
            const user = yield findUserByEmail(email);
            if (!user)
                throw new apiResponse.Api400Error(`Sorry, User not found with this ${email}`);
            // getting default shipping address from user data;
            const defaultAddress = (_b = (_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) === null || _b === void 0 ? void 0 : _b.find((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true);
            if (!defaultAddress)
                throw new apiResponse.Api400Error("Required shipping address !");
            const areaType = defaultAddress === null || defaultAddress === void 0 ? void 0 : defaultAddress.area_type;
            const cartItems = yield ShoppingCart.aggregate([
                { $match: { customerEmail: email } },
                { $unwind: { path: "$items" } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.listingID',
                        foreignField: "_lid",
                        as: "main_product"
                    }
                },
                { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
                { $unset: ["main_product"] },
                {
                    $addFields: {
                        variations: {
                            $ifNull: [
                                {
                                    $arrayElemAt: [{
                                            $filter: {
                                                input: "$variations",
                                                as: "variation",
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$variation.sku', '$items.sku'] },
                                                        { $eq: ['$$variation.stock', "in"] },
                                                        { $eq: ["$status", "active"] },
                                                        { $gte: ["$$variation.available", "$items.quantity"] }
                                                    ]
                                                }
                                            }
                                        }, 0]
                                },
                                {}
                            ]
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        variations: 1,
                        quantity: "$items.quantity",
                        shipping: 1,
                        packaged: 1,
                        supplier: 1,
                        product: {
                            title: 1,
                            slug: "$slug",
                            brand: "$brand",
                            sku: "$variations.sku",
                            listing_id: "$items.listingID",
                            product_id: "$items.productID",
                            imageUrl: { $arrayElemAt: ["$variations.images", 0] },
                            sellingPrice: "$variations.pricing.sellingPrice",
                            baseAmount: { $multiply: ["$variations.pricing.sellingPrice", '$items.quantity'] }
                        },
                    }
                },
                { $unset: ["variations", "items"] }
            ]);
            if (!cartItems || cartItems.length <= 0 || !Array.isArray(cartItems))
                throw new apiResponse.Api400Error("Nothing for purchase ! Please add product in your cart.");
            // adding order id tracking id in individual order items
            const productInfos = [];
            let cartTotal = 0;
            let totalAmount = 0;
            let shippingTotal = 0;
            const groupOrdersBySeller = {};
            let orderIDs = [];
            cartItems.forEach((item) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                item["shipping_charge"] = ((_a = item === null || item === void 0 ? void 0 : item.shipping) === null || _a === void 0 ? void 0 : _a.isFree) ? 0 : calculateShippingCost((((_b = item === null || item === void 0 ? void 0 : item.packaged) === null || _b === void 0 ? void 0 : _b.volumetricWeight) * (item === null || item === void 0 ? void 0 : item.quantity)), areaType);
                item["final_amount"] = parseInt(((_c = item === null || item === void 0 ? void 0 : item.product) === null || _c === void 0 ? void 0 : _c.base_amount) + (item === null || item === void 0 ? void 0 : item.shipping_charge));
                item["order_id"] = generateOrderID((_d = item === null || item === void 0 ? void 0 : item.supplier) === null || _d === void 0 ? void 0 : _d.email);
                item["payment"] = {
                    status: "pending",
                    mode: "card"
                };
                item["order_placed_at"] = timeObject;
                item["state"] = state;
                item["customer"] = {
                    id: _uuid,
                    email,
                    shipping_address: defaultAddress
                };
                item["order_status"] = "placed";
                totalAmount += item === null || item === void 0 ? void 0 : item.final_amount;
                shippingTotal += item === null || item === void 0 ? void 0 : item.shipping_charge;
                cartTotal += parseInt((_e = item === null || item === void 0 ? void 0 : item.product) === null || _e === void 0 ? void 0 : _e.base_amount);
                productInfos.push({
                    productID: (_f = item === null || item === void 0 ? void 0 : item.product) === null || _f === void 0 ? void 0 : _f.product_id,
                    listingID: (_g = item === null || item === void 0 ? void 0 : item.product) === null || _g === void 0 ? void 0 : _g.listing_id,
                    sku: (_h = item === null || item === void 0 ? void 0 : item.product) === null || _h === void 0 ? void 0 : _h.sku,
                    quantity: item === null || item === void 0 ? void 0 : item.quantity
                });
                if (!groupOrdersBySeller[(_j = item === null || item === void 0 ? void 0 : item.supplier) === null || _j === void 0 ? void 0 : _j.email]) {
                    groupOrdersBySeller[(_k = item === null || item === void 0 ? void 0 : item.supplier) === null || _k === void 0 ? void 0 : _k.email] = { items: [] };
                }
                groupOrdersBySeller[(_l = item === null || item === void 0 ? void 0 : item.supplier) === null || _l === void 0 ? void 0 : _l.email].items.push(item);
                orderIDs.push(item === null || item === void 0 ? void 0 : item.order_id);
            });
            if (!totalAmount)
                throw new apiResponse.Api503Error("Service unavailable !");
            if (totalAmount >= 500) {
                totalAmount = totalAmount - shippingTotal;
            }
            // Creating payment intent after getting total amount of order items. 
            const { client_secret, metadata, id } = yield createPaymentIntents(totalAmount, orderIDs);
            if (!client_secret)
                throw new apiResponse.Api400Error("The payment intents failed. Please try again later or contact support if the problem persists.");
            // after order succeed then group the order item by seller email and send email to the seller
            // const orders: any[] = [];
            yield Order.insertMany(cartItems);
            // after successfully got order by seller as a object then loop it and trigger send email function inside for in loop
            for (const sEmail in groupOrdersBySeller) {
                const { items } = groupOrdersBySeller[sEmail];
                // calculate total amount of orders by seller;
                const totalAmount = items.reduce((p, n) => p + parseInt(n === null || n === void 0 ? void 0 : n.final_amount), 0) || 0;
                yield email_service({
                    to: sEmail,
                    subject: "New order confirmed",
                    html: seller_order_email_template(items, email, orderIDs, totalAmount)
                });
            }
            // after calculating total amount and order succeed then email sent to the buyer
            yield email_service({
                to: email,
                subject: "Order confirmed",
                html: buyer_order_email_template(cartItems, { timeObject, shippingAddress: defaultAddress, totalAmount, cartTotal, shippingTotal, email, state })
            });
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Order confirming soon..",
                totalAmount,
                clientSecret: client_secret,
                orderPaymentID: metadata === null || metadata === void 0 ? void 0 : metadata.order_id,
                paymentIntentID: id,
                orderIDs,
                productInfos
            });
        }
        catch (error) {
            next(error);
        }
    });
};
