"use strict";
// src/controllers/order/SetOrder.tsx
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
const { findUserByEmail, actualSellingPrice, calculateShippingCost } = require("../../services/common.service");
const OrderTableModel = require("../../model/orderTable.model");
const { generateItemID, generateOrderID } = require("../../utils/common");
const email_service = require("../../services/email.service");
const { buyer_order_email_template, seller_order_email_template } = require("../../templates/email.template");
module.exports = function CartPurchaseOrder(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userEmail = req.headers.authorization || "";
            const { email: authEmail, _uuid } = req.decoded;
            // initialized current time stamp
            const timestamp = Date.now();
            if (userEmail !== authEmail)
                throw new apiResponse.Api401Error("Unauthorized access !");
            if (!req.body || typeof req.body === "undefined")
                throw new apiResponse.Api400Error("Required body !");
            // get state by body
            const { state } = req.body;
            // finding user by email;
            const user = yield findUserByEmail(authEmail);
            if (!user)
                throw new apiResponse.Api400Error(`Sorry, User not found with this ${authEmail}`);
            // getting default shipping address from user data;
            const defaultAddress = (Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) &&
                ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress.find((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)));
            if (!defaultAddress)
                throw new apiResponse.Api400Error("Required shipping address !");
            const areaType = defaultAddress === null || defaultAddress === void 0 ? void 0 : defaultAddress.area_type;
            const cartItems = yield ShoppingCart.aggregate([
                { $match: { customerEmail: authEmail } },
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
                                { $eq: ["$variations.status", "active"] },
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
                        sellerData: {
                            sellerEmail: '$sellerData.sellerEmail',
                            sellerID: "$sellerData.sellerID",
                            storeName: "$sellerData.storeName",
                            stripeID: "$sellerData.stripeID"
                        },
                        sku: "$variations.sku",
                        baseAmount: { $multiply: [actualSellingPrice, '$items.quantity'] },
                        sellingPrice: actualSellingPrice
                    }
                },
                { $unset: ["variations", "items"] }
            ]);
            if (!cartItems || cartItems.length <= 0 || !Array.isArray(cartItems))
                throw new apiResponse.Api400Error("Nothing for purchase ! Please add product in your cart.");
            // adding order id tracking id in individual order items
            let itmID = generateItemID();
            let itmNumber = 1;
            const productInfos = [];
            let totalAmount = 0;
            const orderBySellers = {};
            cartItems.forEach((item) => {
                var _a, _b, _c;
                item["shippingCharge"] = ((_a = item === null || item === void 0 ? void 0 : item.shipping) === null || _a === void 0 ? void 0 : _a.isFree) ? 0 : calculateShippingCost((_b = item === null || item === void 0 ? void 0 : item.packaged) === null || _b === void 0 ? void 0 : _b.volumetricWeight, areaType);
                item["itemID"] = "item" + (itmID + (itmNumber++)).toString();
                item["baseAmount"] = parseInt((item === null || item === void 0 ? void 0 : item.baseAmount) + (item === null || item === void 0 ? void 0 : item.shippingCharge));
                totalAmount += item === null || item === void 0 ? void 0 : item.baseAmount;
                productInfos.push({
                    productID: item === null || item === void 0 ? void 0 : item.productID,
                    listingID: item === null || item === void 0 ? void 0 : item.listingID,
                    variationID: item === null || item === void 0 ? void 0 : item.variationID,
                    quantity: item === null || item === void 0 ? void 0 : item.quantity
                });
                let sellerEmail = (_c = item === null || item === void 0 ? void 0 : item.sellerData) === null || _c === void 0 ? void 0 : _c.sellerEmail;
                if (!orderBySellers[sellerEmail]) {
                    orderBySellers[sellerEmail] = [];
                }
                orderBySellers[sellerEmail].push(item);
                return item;
            });
            if (!totalAmount)
                throw new apiResponse.Api503Error("Service unavailable !");
            // Creating payment intent after getting total amount of order items. 
            const { client_secret, metadata, id } = yield stripe.paymentIntents.create({
                amount: (totalAmount * 100),
                currency: 'usd',
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
            for (const sellerEmail in orderBySellers) {
                const items = orderBySellers[sellerEmail];
                // calculate total amount of orders by seller;
                const totalAmount = items.reduce((p, n) => p + parseInt(n === null || n === void 0 ? void 0 : n.baseAmount), 0) || 0;
                // generate random order ids;
                const orderID = generateOrderID();
                // then pushing them to orders variable;
                orders.push({
                    orderID,
                    orderPaymentID: metadata === null || metadata === void 0 ? void 0 : metadata.order_id,
                    clientSecret: client_secret,
                    customerEmail: authEmail,
                    customerID: _uuid,
                    sellerEmail,
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
                    orderStatus: "pending",
                    items: items,
                });
                yield email_service({
                    to: sellerEmail,
                    subject: "New order confirmed",
                    html: seller_order_email_template(items, authEmail, orderID)
                });
            }
            // finally insert orders to the database;
            const result = yield OrderTableModel.insertMany(orders);
            if (!result || result.length <= 0)
                throw new apiResponse.Api400Error("Sorry order processing failed !");
            // after calculating total amount and order succeed then email sent to the buyer
            yield email_service({
                to: authEmail,
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
// module.exports = async function SetOrder(req: Request, res: Response, next: NextFunction) {
//    try {
//       const userEmail: string = req.headers.authorization || "";
//       const { email: authEmail, _uuid } = req.decoded;
//       if (userEmail !== authEmail)
//          throw new apiResponse.Api401Error("Unauthorized access !");
//       if (!req.body || typeof req.body === "undefined")
//          throw new apiResponse.Api400Error("Required body !");
//       const { state } = req.body;
//       const user = await findUserByEmail(authEmail);
//       const defaultAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
//          user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);
//       if (!defaultAddress)
//          throw new apiResponse.Api400Error("Required shipping address !");
//       const areaType = defaultAddress?.area_type;
//       const cartItems = await ShoppingCart.aggregate([
//          { $match: { customerEmail: authEmail } },
//          { $unwind: { path: "$items" } },
//          {
//             $lookup: {
//                from: 'products',
//                localField: 'items.listingID',
//                foreignField: "_lid",
//                as: "main_product"
//             }
//          },
//          { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
//          { $unset: ["main_product"] },
//          { $unwind: { path: "$variations" } },
//          {
//             $match: {
//                $expr: {
//                   $and: [
//                      { $eq: ['$variations._vrid', '$items.variationID'] },
//                      { $eq: ["$variations.stock", "in"] },
//                      { $eq: ["$variations.status", "active"] },
//                      { $gte: ["$variations.available", "$items.quantity"] }
//                   ]
//                }
//             }
//          },
//          {
//             $project: {
//                _id: 0,
//                variations: 1,
//                quantity: "$items.quantity",
//                shipping: 1,
//                productID: "$items.productID",
//                packaged: 1,
//                listingID: "$items.listingID",
//                variationID: "$items.variationID",
//                image: { $first: "$images" },
//                title: "$variations.vTitle",
//                slug: 1,
//                brand: 1,
//                sellerData: {
//                   sellerEmail: '$sellerData.sellerEmail',
//                   sellerID: "$sellerData.sellerID",
//                   storeName: "$sellerData.storeName"
//                },
//                sku: "$variations.sku",
//                baseAmount: { $multiply: [actualSellingPrice, '$items.quantity'] },
//                sellingPrice: actualSellingPrice
//             }
//          },
//          {
//             $set: {
//                customerEmail: authEmail,
//                customerID: _uuid,
//                shippingAddress: defaultAddress,
//                areaType: areaType,
//                state: state
//             }
//          },
//          { $unset: ["variations", "items"] }
//       ]);
//       if (!cartItems || cartItems.length <= 0 || !Array.isArray(cartItems))
//          throw new apiResponse.Api400Error("Nothing for purchase ! Please add product in your cart.");
//       cartItems.forEach((p: any) => {
//          p["shippingCharge"] = p?.shipping?.isFree ? 0 : calculateShippingCost(p?.packaged?.volumetricWeight, areaType);
//          return p;
//       });
//       // calculating total amount of order items
//       const totalAmount: number = cartItems.reduce((p: number, n: any) => p + parseInt(n?.baseAmount + n?.shippingCharge), 0) || 0;
//       if (!totalAmount) throw new apiResponse.Api503Error("Service unavailable !");
//       // Creating payment intent after getting total amount of order items. 
//       const { client_secret, metadata } = await stripe.paymentIntents.create({
//          amount: (totalAmount * 100),
//          currency: 'usd',
//          payment_method_types: ['card'],
//          metadata: {
//             order_id: "opi_" + (Math.round(Math.random() * 99999999) + totalAmount).toString()
//          }
//       });
//       if (!client_secret)
//          throw new apiResponse.Api400Error("The payment failed. Please try again later or contact support if the problem persists.");
//       return res.status(200).send({
//          success: true,
//          statusCode: 200,
//          cartItems,
//          totalAmount: totalAmount,
//          message: "Order confirming soon..",
//          clientSecret: client_secret,
//          orderPaymentID: metadata?.order_id
//       });
//    } catch (error: any) {
//       next(error);
//    }
// };