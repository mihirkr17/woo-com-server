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
const { Api400Error, Api500Error } = require("../../errors/apiResponse");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const ShoppingCart = require("../../model/shoppingCart.model");
const { findUserByEmail, createPaymentIntents, clearCart, update_variation_stock_available } = require("../../services/common.service");
const { cartContextCalculation } = require("../../utils/common");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");
const Order = require("../../model/order.model");
const { shopping_cart_pipe } = require("../../utils/pipelines");
module.exports = function CartPurchaseOrder(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, _id } = req.decoded;
            // initialized current time stamp
            const timestamp = Date.now();
            if (!req.body || typeof req.body === "undefined")
                throw new Api400Error("Required body !");
            // get state by body
            const { state, paymentMethodId, session } = req.body;
            if (!paymentMethodId)
                throw new Api500Error("Required payment method id !");
            // finding user by email;
            const user = yield findUserByEmail(email);
            if (!user)
                throw new Api400Error(`Sorry, User not found with this ${email}`);
            // getting default shipping address from user data;
            const defaultAddress = (_a = user === null || user === void 0 ? void 0 : user.shippingAddress) === null || _a === void 0 ? void 0 : _a.find((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true);
            if (!defaultAddress)
                throw new Api400Error("Required shipping address !");
            let cartItems = yield ShoppingCart.aggregate(shopping_cart_pipe(_id));
            if (!cartItems || cartItems.length <= 0 || !Array.isArray(cartItems))
                throw new Api400Error("Nothing for purchase ! Please add product in your cart.");
            const { finalAmount } = cartContextCalculation(cartItems);
            const productInfos = [];
            const groupOrdersBySeller = {};
            // generating item id
            let itemId = Math.round(Math.random() * 9999999999);
            // assigning some value to items
            cartItems.forEach((item) => {
                itemId++;
                item["itemId"] = itemId;
                productInfos.push({
                    productId: item === null || item === void 0 ? void 0 : item.productId,
                    sku: item === null || item === void 0 ? void 0 : item.sku,
                    quantity: item === null || item === void 0 ? void 0 : item.quantity
                });
                if (!groupOrdersBySeller[item === null || item === void 0 ? void 0 : item.supplierEmail]) {
                    groupOrdersBySeller[item === null || item === void 0 ? void 0 : item.supplierEmail] = { items: [] };
                }
                groupOrdersBySeller[item === null || item === void 0 ? void 0 : item.supplierEmail].items.push(item);
            });
            // creating order instance
            let order = new Order({
                customerId: _id,
                shippingAddress: defaultAddress,
                orderStatus: "placed",
                state,
                orderPlacedAt: new Date(timestamp),
                paymentMode: "card",
                paymentStatus: "pending",
                items: cartItems,
                totalAmount: finalAmount
            });
            // saving order into db
            const result = yield order.save();
            if (!(result === null || result === void 0 ? void 0 : result._id))
                throw new Api500Error("Sorry! Order not placed.");
            // creating payment throw payment intent
            const intent = yield createPaymentIntents(finalAmount, result === null || result === void 0 ? void 0 : result._id.toString(), paymentMethodId, session, req === null || req === void 0 ? void 0 : req.ip, req.get("user-agent"));
            // if payment success then change order payment status and save
            if (intent === null || intent === void 0 ? void 0 : intent.id) {
                order.paymentIntentId = intent === null || intent === void 0 ? void 0 : intent.id;
                order.paymentStatus = "paid";
            }
            const [clearCartResult, orderResult, updateInventoryResult] = yield Promise.all([
                clearCart(_id, email),
                order.save(),
                update_variation_stock_available("dec", productInfos),
            ]);
            if (!orderResult)
                throw new Api500Error("Internal server error !");
            // after success return the response to the client
            return res.status(200).send({
                success: true,
                statusCode: 200,
                status: intent === null || intent === void 0 ? void 0 : intent.status,
                paymentIntentId: intent === null || intent === void 0 ? void 0 : intent.id,
                clientSecret: intent === null || intent === void 0 ? void 0 : intent.client_secret,
                message: "Payment succeed and order has been placed."
            });
        }
        catch (error) {
            console.log(error === null || error === void 0 ? void 0 : error.name);
            next(error);
        }
    });
};
