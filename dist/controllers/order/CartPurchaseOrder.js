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
const { actualSellingPriceProject } = require("../../utils/projection");
const { findUserByEmail } = require("../../services/common.service");
const { calculateShippingCost } = require("../../utils/common");
const OrderTableModel = require("../../model/orderTable.model");
const { generateItemID, generateOrderID } = require("../../utils/generator");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");
module.exports = function CartPurchaseOrder(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, _uuid } = req.decoded;
            // initialized current time stamp
            const timestamp = Date.now();
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
                { $unwind: { path: "$variations" } },
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$variations._vrid', '$items.variationID'] },
                                { $eq: ["$variations.stock", "in"] },
                                { $eq: ["$status", "active"] },
                                { $gte: ["$variations.available", "$items.quantity"] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        variations: 1,
                        quantity: "$items.quantity",
                        shipping: 1,
                        productID: "$items.productID",
                        packaged: 1,
                        listingID: "$items.listingID",
                        variationID: "$items.variationID",
                        image: { $first: "$images" },
                        title: "$variations.vTitle",
                        slug: 1,
                        brand: 1,
                        supplier: {
                            email: '$supplier.email',
                            id: "$supplier.id",
                            store_name: "$supplier.store_name",
                            stripe_id: "$supplier.stripeID"
                        },
                        sku: "$variations.sku",
                        baseAmount: { $multiply: [actualSellingPriceProject, '$items.quantity'] },
                        sellingPrice: actualSellingPriceProject,
                    }
                },
                { $unset: ["variations", "items"] }
            ]);
            if (!cartItems || cartItems.length <= 0 || !Array.isArray(cartItems))
                throw new apiResponse.Api400Error("Nothing for purchase ! Please add product in your cart.");
            // adding order id tracking id in individual order items
            let itemNumber = 1;
            const productInfos = [];
            let totalAmount = 0;
            const groupOrdersBySeller = {};
            cartItems.forEach((item) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                item["shippingCharge"] = ((_a = item === null || item === void 0 ? void 0 : item.shipping) === null || _a === void 0 ? void 0 : _a.isFree) ? 0 : calculateShippingCost((((_b = item === null || item === void 0 ? void 0 : item.packaged) === null || _b === void 0 ? void 0 : _b.volumetricWeight) * (item === null || item === void 0 ? void 0 : item.quantity)), areaType);
                item["itemID"] = "item" + (generateItemID() + (itemNumber++)).toString();
                item["baseAmount"] = parseInt((item === null || item === void 0 ? void 0 : item.baseAmount) + (item === null || item === void 0 ? void 0 : item.shippingCharge));
                totalAmount += item === null || item === void 0 ? void 0 : item.baseAmount;
                productInfos.push({
                    productID: item === null || item === void 0 ? void 0 : item.productID,
                    listingID: item === null || item === void 0 ? void 0 : item.listingID,
                    variationID: item === null || item === void 0 ? void 0 : item.variationID,
                    quantity: item === null || item === void 0 ? void 0 : item.quantity
                });
                if (!groupOrdersBySeller[(_c = item === null || item === void 0 ? void 0 : item.supplier) === null || _c === void 0 ? void 0 : _c.email]) {
                    groupOrdersBySeller[(_d = item === null || item === void 0 ? void 0 : item.supplier) === null || _d === void 0 ? void 0 : _d.email] = { items: [], store: "", sellerID: "" };
                }
                groupOrdersBySeller[(_e = item === null || item === void 0 ? void 0 : item.supplier) === null || _e === void 0 ? void 0 : _e.email].store = (_f = item === null || item === void 0 ? void 0 : item.supplier) === null || _f === void 0 ? void 0 : _f.store_name;
                groupOrdersBySeller[(_g = item === null || item === void 0 ? void 0 : item.supplier) === null || _g === void 0 ? void 0 : _g.email].sellerID = (_h = item === null || item === void 0 ? void 0 : item.supplier) === null || _h === void 0 ? void 0 : _h.id;
                groupOrdersBySeller[(_j = item === null || item === void 0 ? void 0 : item.supplier) === null || _j === void 0 ? void 0 : _j.email].items.push(item);
            });
            if (!totalAmount)
                throw new apiResponse.Api503Error("Service unavailable !");
            // Creating payment intent after getting total amount of order items. 
            const { client_secret, metadata, id } = yield stripe.paymentIntents.create({
                amount: (totalAmount * 100),
                currency: 'bdt',
                payment_method_types: ['card'],
                metadata: {
                    order_id: "opi_" + (Math.round(Math.random() * 99999999) + totalAmount).toString()
                }
            });
            if (!client_secret)
                throw new apiResponse.Api400Error("The payment intents failed. Please try again later or contact support if the problem persists.");
            // after order succeed then group the order item by seller email and send email to the seller
            const orders = [];
            // after successfully got order by seller as a object then loop it and trigger send email function inside for in loop
            for (const sEmail in groupOrdersBySeller) {
                const { items, store, sellerID } = groupOrdersBySeller[sEmail];
                // calculate total amount of orders by seller;
                const totalAmount = items.reduce((p, n) => p + parseInt(n === null || n === void 0 ? void 0 : n.baseAmount), 0) || 0;
                // generate random order ids;
                const orderID = generateOrderID(sellerID);
                // then pushing them to orders variable;
                orders.push({
                    orderID,
                    orderPaymentID: metadata === null || metadata === void 0 ? void 0 : metadata.order_id,
                    clientSecret: client_secret,
                    customerEmail: email,
                    customerID: _uuid,
                    seller: {
                        email: sEmail,
                        store
                    },
                    totalAmount,
                    paymentIntentID: id,
                    paymentStatus: "pending",
                    orderAT: {
                        iso: new Date(timestamp),
                        time: new Date(timestamp).toLocaleTimeString(),
                        date: new Date(timestamp).toDateString(),
                        timestamp: timestamp
                    },
                    state,
                    shippingAddress: defaultAddress,
                    areaType,
                    paymentMode: "card",
                    orderStatus: "placed",
                    items: items,
                });
                yield email_service({
                    to: sEmail,
                    subject: "New order confirmed",
                    html: seller_order_email_template(items, email, orderID)
                });
            }
            // finally insert orders to the database;
            const result = yield OrderTableModel.insertMany(orders);
            if (!result || result.length <= 0)
                throw new apiResponse.Api400Error("Sorry order processing failed !");
            // after calculating total amount and order succeed then email sent to the buyer
            yield email_service({
                to: email,
                subject: "Order confirmed",
                html: buyer_order_email_template(cartItems, totalAmount)
            });
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Order confirming soon..",
                totalAmount,
                clientSecret: client_secret,
                orderPaymentID: metadata === null || metadata === void 0 ? void 0 : metadata.order_id,
                productInfos
            });
        }
        catch (error) {
            next(error);
        }
    });
};
