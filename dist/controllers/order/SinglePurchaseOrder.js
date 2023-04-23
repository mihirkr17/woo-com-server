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
const { generateItemID, generateOrderID } = require("../../utils/common");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const OrderTableModel = require("../../model/orderTable.model");
module.exports = function SinglePurchaseOrder(req, res, next) {
    var _a, _b;
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
            let itemNumber = 1;
            let sellerEmail = "";
            let sellerStore = "";
            let sellerID = "";
            const productInfos = [];
            product.forEach((p) => {
                var _a, _b, _c, _d, _e;
                p["shippingCharge"] = ((_a = p === null || p === void 0 ? void 0 : p.shipping) === null || _a === void 0 ? void 0 : _a.isFree) ? 0 : calculateShippingCost((_b = p === null || p === void 0 ? void 0 : p.packaged) === null || _b === void 0 ? void 0 : _b.volumetricWeight, areaType);
                p["itemID"] = "item" + (generateItemID() + (itemNumber++)).toString();
                p["baseAmount"] = parseInt((p === null || p === void 0 ? void 0 : p.baseAmount) + (p === null || p === void 0 ? void 0 : p.shippingCharge));
                sellerEmail = (_c = p === null || p === void 0 ? void 0 : p.sellerData) === null || _c === void 0 ? void 0 : _c.sellerEmail;
                sellerStore = (_d = p === null || p === void 0 ? void 0 : p.sellerData) === null || _d === void 0 ? void 0 : _d.storeName;
                sellerID = (_e = p === null || p === void 0 ? void 0 : p.sellerData) === null || _e === void 0 ? void 0 : _e.sellerID;
                productInfos.push({
                    productID: p === null || p === void 0 ? void 0 : p.productID,
                    listingID: p === null || p === void 0 ? void 0 : p.listingID,
                    variationID: p === null || p === void 0 ? void 0 : p.variationID,
                    quantity: p === null || p === void 0 ? void 0 : p.quantity
                });
                return p;
            });
            const totalAmount = product.reduce((p, n) => p + parseInt(n === null || n === void 0 ? void 0 : n.baseAmount), 0) || 0;
            // creating payment intents here
            const { client_secret, metadata, id } = yield stripe.paymentIntents.create({
                amount: (totalAmount * 100),
                currency: 'bdt',
                payment_method_types: ['card'],
                metadata: {
                    order_id: "opi_" + (Math.round(Math.random() * 99999999) + totalAmount).toString()
                }
            });
            if (!client_secret)
                throw new apiResponse.Api400Error("Payment intent creation failed !");
            const orderTable = new OrderTableModel({
                orderID: generateOrderID(sellerID),
                orderPaymentID: metadata === null || metadata === void 0 ? void 0 : metadata.order_id,
                clientSecret: client_secret,
                customerEmail: email,
                customerID: _uuid,
                sellerEmail,
                sellerStore,
                totalAmount,
                paymentIntentID: id,
                paymentStatus: "pending",
                orderAT: {
                    iso: new Date(timestamp),
                    time: new Date(timestamp).toLocaleTimeString(),
                    date: new Date(timestamp).toDateString(),
                    timestamp
                },
                state,
                shippingAddress: defaultShippingAddress,
                areaType,
                paymentMode: "card",
                orderStatus: "pending",
                items: product,
            });
            const result = yield orderTable.save();
            yield email_service({
                to: sellerEmail,
                subject: "New order confirmed",
                html: seller_order_email_template(product, email, result === null || result === void 0 ? void 0 : result.orderID)
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
                productInfos
            });
            // product = product[0];
            // product["orderID"] = generateItemID();
            // product["trackingID"] = generateTrackingID();
            // product["shippingCharge"] = product?.shipping?.isFree ? 0 : calculateShippingCost(product?.packaged?.volumetricWeight, areaType);
            // product["baseAmount"] = parseInt(product?.baseAmount + product?.shippingCharge);
            // product["orderAT"] = {
            //    iso: new Date(timestamp),
            //    time: new Date(timestamp).toLocaleTimeString(),
            //    date: new Date(timestamp).toDateString(),
            //    timestamp: timestamp
            // }
            // product["clientSecret"] = client_secret;
            // product["orderPaymentID"] = metadata?.order_id;
            // product["paymentIntentID"] = id;
            // const result = await Order.findOneAndUpdate(
            //    { user_email: email },
            //    { $push: { orders: product } },
            //    { upsert: true }
            // );
            // if (!result) throw new apiResponse.Api503Error("Service unavailable !");
            // return res.status(200).send({
            //    success: true,
            //    statusCode: 200,
            //    data: product
            // });
        }
        catch (error) {
            next(error);
        }
    });
};
// module.exports = async function SinglePurchaseOrder(req: Request, res: Response, next: NextFunction) {
//    try {
//       const email = req.decoded.email;
//       const _uuid = req.decoded._uuid;
//       const timestamp: any = Date.now();
//       if (!req.body) throw new apiResponse.Api503Error("Service unavailable !");
//       const { variationID, productID, quantity, listingID, paymentIntentID, state, paymentMethodID, orderPaymentID, customerEmail } = req.body;
//       if (!variationID || !productID || !quantity || !listingID || !paymentIntentID || !state || !paymentMethodID || !orderPaymentID || !customerEmail)
//          throw new apiResponse.Api400Error("Required variationID, productID, quantity, listingID, paymentIntentID, state, paymentMethodID, orderPaymentID, customerEmail");
//       const user = await findUserByEmail(email);
//       if (!user) throw new apiResponse.Api503Error("Service unavailable !")
//       const defaultShippingAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
//          user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);
//       const areaType = defaultShippingAddress?.area_type;
//       let product = await Product.aggregate([
//          { $match: { $and: [{ _lid: listingID }, { _id: ObjectId(productID) }] } },
//          { $unwind: { path: "$variations" } },
//          { $match: { $and: [{ 'variations._vrid': variationID }] } },
//          {
//             $project: {
//                _id: 0,
//                title: "$variations.vTitle",
//                slug: 1,
//                variations: 1,
//                brand: 1,
//                image: { $first: "$images" },
//                sku: "$variations.sku",
//                sellerData: {
//                   sellerEmail: '$sellerData.sellerEmail',
//                   sellerID: "$sellerData.sellerID",
//                   storeName: "$sellerData.storeName"
//                },
//                shipping: 1,
//                packaged: 1,
//                baseAmount: { $multiply: [actualSellingPrice, parseInt(quantity)] },
//                sellingPrice: actualSellingPrice,
//             }
//          },
//          {
//             $set: {
//                customerEmail: customerEmail,
//                paymentMode: "card",
//                state: state,
//                shippingAddress: defaultShippingAddress,
//                paymentStatus: "success",
//                customerID: _uuid,
//                orderStatus: "pending",
//                paymentIntentID: paymentIntentID,
//                paymentMethodID: paymentMethodID,
//                orderPaymentID: orderPaymentID,
//                productID: productID,
//                listingID: listingID,
//                variationID: variationID,
//                quantity: quantity
//             }
//          },
//          {
//             $unset: ["variations"]
//          }
//       ]);
//       if (typeof product === 'undefined' || !Array.isArray(product))
//          throw new apiResponse.Api503Error("Service unavailable !");
//       product = product[0];
//       product["orderID"] = generateItemID();
//       product["trackingID"] = generateTrackingID();
//       product["shippingCharge"] = product?.shipping?.isFree ? 0 : calculateShippingCost(product?.packaged?.volumetricWeight, areaType);
//       product["baseAmount"] = parseInt(product?.baseAmount + product?.shippingCharge);
//       product["orderAT"] = {
//          iso: new Date(timestamp),
//          time: new Date(timestamp).toLocaleTimeString(),
//          date: new Date(timestamp).toDateString(),
//          timestamp: timestamp
//       }
//       const result = await Order.findOneAndUpdate(
//          { user_email: email },
//          { $push: { orders: product } },
//          { upsert: true }
//       );
//       if (!result) throw new apiResponse.Api503Error("Service unavailable !");
//       await update_variation_stock_available("dec", { variationID, productID, quantity, listingID });
//       email && await email_service({
//          to: email,
//          subject: "Order confirmed",
//          html: buyer_order_email_template(product, product?.baseAmount)
//       });
//       product?.sellerData?.sellerEmail && await email_service({
//          to: product?.sellerData?.sellerEmail,
//          subject: "New order confirmed",
//          html: seller_order_email_template([product])
//       });
//       return res.status(200).send({ success: true, statusCode: 200, message: "Order Success." });
//    } catch (error: any) {
//       next(error)
//    }
// }
