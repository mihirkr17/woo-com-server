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
const { productStockUpdater, orderStatusUpdater, } = require("../services/common.service");
const apiResponse = require("../res/response");
const smtpSender = require("../services/email.service");
const NodeCache = require("../utils/NodeCache");
const { ORDER_TABLE, ORDER_ITEMS_TABLE } = require("../model/ORDER_TBL");
const Customer = require("../model/CUSTOMER_TBL");
const { ObjectId } = require("mongodb");
function myOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, _id: userId } = req.decoded;
            const customer = yield Customer.findOne({ userId: ObjectId(userId) }, { _id: 1 });
            let orders;
            let ordersInCache = NodeCache.getCache(`${email}_myOrders`);
            if (ordersInCache) {
                orders = ordersInCache;
            }
            else {
                orders = yield ORDER_ITEMS_TABLE.find({
                    customerId: ObjectId(customer === null || customer === void 0 ? void 0 : customer._id),
                });
                // let orderItems = await ORDER_ITEMS_TABLE.find();
                NodeCache.saveCache(`${email}_myOrders`, orders);
            }
            return res
                .status(200)
                .send({ success: true, statusCode: 200, data: { module: { orders } } });
        }
        catch (error) {
            next(error);
        }
    });
}
function removeOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, orderID } = req.params;
            const result = yield ORDER_TABLE.findOneAndDelete({
                $and: [{ order_id: orderID }, { "customer.email": email }],
            });
            if (!result)
                throw new apiResponse.Error400("ORDER_TABLE removed failed !");
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "ORDER_TABLE Removed successfully",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function cancelMyOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.params.email;
            const { cancelReason, orderID, product } = req === null || req === void 0 ? void 0 : req.body;
            if (!orderID || typeof orderID !== "string")
                throw new apiResponse.Error400("Required order ID !");
            if (!cancelReason || typeof cancelReason !== "string")
                throw new apiResponse.Error400("Required cancel reason !");
            if (!product)
                throw new apiResponse.Error400("Required order items information !");
            // calling parallel api
            const [orderStatusResult, variationResult, emailSendingResult] = yield Promise.all([
                orderStatusUpdater({
                    customerEmail: email,
                    sellerEmail: product === null || product === void 0 ? void 0 : product.sellerEmail,
                    orderID,
                    type: "canceled",
                    cancelReason,
                }),
                productStockUpdater("inc", product),
                smtpSender({
                    to: email,
                    subject: "ORDER_TABLE canceled confirm",
                    html: `
          <h3>
            ORDER_TABLE canceled with ID : ${orderID}
          </h3>
          <br />
          <p>Cancel Reason: ${cancelReason.replace(/[_+]/gi, " ")}</p>
          <br />
          <ul style="padding: 10px;">
            <li style="margin: 5px;">
              Title: ${product === null || product === void 0 ? void 0 : product.title}. <br />
              Total: ${product === null || product === void 0 ? void 0 : product.finalAmount} Tk. <br />
              Qty: ${product === null || product === void 0 ? void 0 : product.quantity} pcs.
            </li>
          </ul>`,
                }),
            ]);
            return (orderStatusResult &&
                res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "ORDER_TABLE canceled successfully",
                }));
        }
        catch (error) {
            next(error);
        }
    });
}
function orderDetails(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req === null || req === void 0 ? void 0 : req.decoded;
            const { orderId, itemId } = req === null || req === void 0 ? void 0 : req.params;
            if (!orderId || !itemId)
                throw new apiResponse.Error400("Required order id and item id !");
            let order;
            let orderDetailsInCache = NodeCache.getCache(`${email}_${orderId}_orderDetails`);
            if (orderDetailsInCache) {
                order = orderDetailsInCache;
            }
            else {
                let num = 1;
                order = yield ORDER_TABLE.aggregate([
                    {
                        $match: { _id: ObjectId(orderId) },
                    },
                    {
                        $lookup: {
                            from: "ORDER_ITEMS_TBL",
                            let: {
                                order_id: "$_id",
                                customer: "$customerId",
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$orderId", "$$order_id"] },
                                                { $eq: ["$customerId", "$$customer"] },
                                            ],
                                        },
                                    },
                                },
                                {
                                    $project: { customerId: 0 },
                                },
                                {
                                    $group: {
                                        _id: {
                                            storeTitle: "$storeTitle",
                                            supplierId: "$supplierId",
                                            orderId: "$orderId",
                                        },
                                        packTotal: { $sum: "$amount" },
                                        products: { $push: "$$ROOT" },
                                    },
                                },
                            ],
                            as: "items",
                        },
                    },
                    {
                        $project: {
                            items: 1,
                            shippingAddress: 1,
                            totalAmount: 1,
                            paymentStatus: 1,
                            customerId: 1,
                            paymentMode: 1,
                            orderPlacedAt: 1,
                        },
                    },
                ]);
                order = order.length === 1 ? order[0] : {};
                NodeCache.saveCache(`${email}_${orderId}_orderDetails`, order);
            }
            if (!order)
                throw new apiResponse.Error404("Sorry order not found !");
            return res.status(200).send({
                success: true,
                statusCode: 200,
                data: {
                    order,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
module.exports = { myOrder, removeOrder, cancelMyOrder, orderDetails };
