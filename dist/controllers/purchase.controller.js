"use strict";
// src/controllers/purchase.controller.ts
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
const { single_purchase_pipe, shopping_cart_pipe, } = require("../utils/pipelines");
const { cartContextCalculation } = require("../utils/common");
const { startSession } = require("mongoose");
const { Order, OrderItems } = require("../model/order.model");
const ShoppingCart = require("../model/shoppingCart.model");
const { findUserByEmail, createPaymentIntents, clearCart, productStockUpdater, } = require("../services/common.service");
const smtpSender = require("../services/email.service");
const { Api400Error, Api500Error, Api503Error, } = require("../errors/apiResponse");
const Product = require("../model/product.model");
const Customer = require("../model/customer.model");
const { ObjectId } = require("mongodb");
function initializedOneForPurchase(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, _id } = req.decoded;
            let user = yield findUserByEmail(email);
            const { sku, quantity, productId } = req === null || req === void 0 ? void 0 : req.body;
            let defaultShippingAddress = Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) &&
                ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]);
            let newQuantity = parseInt(quantity);
            let product = yield Product.aggregate(single_purchase_pipe(productId, sku, newQuantity));
            const { amount, totalQuantity, shippingCost, finalAmount, savingAmount, discountShippingCost, } = cartContextCalculation(product);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                data: {
                    module: {
                        cartItems: product,
                        cartCalculation: {
                            amount,
                            totalQuantity,
                            finalAmount,
                            shippingCost,
                            savingAmount,
                            discountShippingCost,
                        },
                        numberOfProduct: product.length || 0,
                        defaultShippingAddress,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function purchaseCart(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield startSession();
        session.startTransaction();
        try {
            const { email, _id } = req.decoded;
            // initialized current time stamp
            const timestamp = Date.now();
            if (!req.body || typeof req.body === "undefined")
                throw new Api400Error("Required body !");
            // get state by body
            const { state, paymentMethodId, session: paymentSessionId } = req.body;
            if (state !== "CART")
                throw new Api400Error("Invalid state !");
            if (!paymentMethodId)
                throw new Api400Error("Required payment method id !");
            // finding user by email;
            const user = yield Customer.findOne({ userId: ObjectId(_id) });
            if (!user)
                throw new Api400Error(`Sorry, User not found with this ${email}`);
            // getting default shipping address from user data;
            const defaultAddress = (_a = user === null || user === void 0 ? void 0 : user.shippingAddress) === null || _a === void 0 ? void 0 : _a.find((adr) => (adr === null || adr === void 0 ? void 0 : adr.active) === true);
            if (!defaultAddress)
                throw new Api400Error("Required shipping address !");
            let cartItems = yield ShoppingCart.aggregate(shopping_cart_pipe(_id));
            if (!cartItems || cartItems.length <= 0 || !Array.isArray(cartItems))
                throw new Api400Error("Nothing for purchase ! Please add product in your cart.");
            const { finalAmount } = cartContextCalculation(cartItems);
            // creating order instance
            let order = new Order({
                customerId: _id,
                shippingAddress: defaultAddress,
                orderStatus: "placed",
                state,
                orderPlacedAt: new Date(timestamp),
                paymentMode: "card",
                paymentStatus: "pending",
                totalAmount: finalAmount,
            });
            // saving order into db
            const result = yield order.save();
            if (!(result === null || result === void 0 ? void 0 : result._id))
                throw new Error("Sorry! Order not placed.");
            const productInfos = [];
            const groupOrdersBySeller = {};
            // generating item id
            let itemId = Math.round(Math.random() * 9999999999);
            // assigning some value to items
            cartItems.forEach((item) => {
                itemId++;
                item["_id"] = new ObjectId();
                item["orderId"] = result === null || result === void 0 ? void 0 : result._id;
                productInfos.push({
                    productId: item === null || item === void 0 ? void 0 : item.productId,
                    sku: item === null || item === void 0 ? void 0 : item.sku,
                    quantity: item === null || item === void 0 ? void 0 : item.quantity,
                });
                if (!groupOrdersBySeller[item === null || item === void 0 ? void 0 : item.supplierEmail]) {
                    groupOrdersBySeller[item === null || item === void 0 ? void 0 : item.supplierEmail] = { items: [] };
                }
                groupOrdersBySeller[item === null || item === void 0 ? void 0 : item.supplierEmail].items.push(item);
            });
            yield OrderItems.insertMany(cartItems);
            // creating payment throw payment intent
            const intent = yield createPaymentIntents(finalAmount, result === null || result === void 0 ? void 0 : result._id.toString(), paymentMethodId, paymentSessionId, req === null || req === void 0 ? void 0 : req.ip, req.get("user-agent"));
            // if payment success then change order payment status and save
            if (intent === null || intent === void 0 ? void 0 : intent.id) {
                order.paymentIntentId = intent === null || intent === void 0 ? void 0 : intent.id;
                order.paymentStatus = "paid";
            }
            const [clearCartResult, orderResult, updateInventoryResult] = yield Promise.all([
                clearCart(_id, email),
                order.save(),
                productStockUpdater("dec", productInfos),
            ]);
            if (!orderResult)
                throw new Api500Error("Internal server error !");
            yield session.commitTransaction();
            session.endSession();
            // after success return the response to the client
            return res.status(200).send({
                success: true,
                statusCode: 200,
                status: intent === null || intent === void 0 ? void 0 : intent.status,
                paymentIntentId: intent === null || intent === void 0 ? void 0 : intent.id,
                clientSecret: intent === null || intent === void 0 ? void 0 : intent.client_secret,
                message: "Payment succeed and order has been placed.",
            });
        }
        catch (error) {
            yield session.abortTransaction();
            session.endSession();
            next(error);
        }
    });
}
function purchaseOne(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield startSession();
        session.startTransaction();
        try {
            const { email, _id } = req.decoded;
            const timestamp = Date.now();
            if (!req.body)
                throw new Api503Error("Service unavailable !");
            const { sku, productId, quantity, session: paymentSessionId, paymentMethodId, } = req.body;
            if (!sku || !productId || !quantity || !paymentMethodId)
                throw new Api400Error("Required sku, product id, quantity, paymentMethodId");
            const user = yield findUserByEmail(email);
            if (!user)
                throw new Api503Error("Service unavailable !");
            const defaultAddress = (_a = user === null || user === void 0 ? void 0 : user.shippingAddress) === null || _a === void 0 ? void 0 : _a.find((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true);
            let item = yield Product.aggregate(single_purchase_pipe(productId, sku, quantity));
            if (typeof item === "undefined" || !Array.isArray(item))
                throw new Api503Error("Service unavailable !");
            const { finalAmount } = cartContextCalculation(item);
            let order = new Order({
                state: "buy",
                customerId: _id,
                shippingAddress: defaultAddress,
                orderStatus: "placed",
                orderPlacedAt: new Date(timestamp),
                paymentMode: "card",
                paymentStatus: "pending",
                items: item,
                totalAmount: finalAmount,
            });
            const result = yield order.save();
            const intent = yield createPaymentIntents(finalAmount, result === null || result === void 0 ? void 0 : result._id.toString(), paymentMethodId, paymentSessionId, req === null || req === void 0 ? void 0 : req.ip, req.get("user-agent"));
            // if payment success then change order payment status and save
            if (intent === null || intent === void 0 ? void 0 : intent.id) {
                order.paymentIntentId = intent === null || intent === void 0 ? void 0 : intent.id;
                order.paymentStatus = "paid";
            }
            const [orderResult, updateInventoryResult] = yield Promise.all([
                order.save(),
                productStockUpdater("dec", item),
            ]);
            if (!orderResult)
                throw new Api500Error("Internal server error !");
            yield session.commitTransaction();
            session.endSession();
            // after success return the response to the client
            return res.status(200).send({
                success: true,
                statusCode: 200,
                status: intent === null || intent === void 0 ? void 0 : intent.status,
                paymentIntentId: intent === null || intent === void 0 ? void 0 : intent.id,
                clientSecret: intent === null || intent === void 0 ? void 0 : intent.client_secret,
                message: "Payment succeed and order has been placed.",
            });
        }
        catch (error) {
            yield session.abortTransaction();
            session.endSession();
            next(error);
        }
    });
}
module.exports = { purchaseOne, purchaseCart, initializedOneForPurchase };
