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
const { update_variation_stock_available, order_status_updater } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const email_service = require("../../services/email.service");
const NodeCache = require("../../utils/NodeCache");
const Order = require("../../model/order.model");
const { ObjectId } = require("mongodb");
module.exports.myOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.params;
        const { email: authEmail, _id } = req.decoded;
        let orders;
        if (email !== authEmail) {
            return res.status(401).send();
        }
        let cacheMyOrder = NodeCache.getCache(`${authEmail}_myOrders`);
        if (cacheMyOrder) {
            orders = cacheMyOrder;
        }
        else {
            orders = yield Order.aggregate([
                { $match: { customerId: ObjectId(_id) } },
                { $unwind: { path: "$items" } },
                { $replaceRoot: { newRoot: { $mergeObjects: ["$items", "$$ROOT"] } } },
                {
                    $project: {
                        title: 1, itemId: 1, quantity: 1, imageUrl: 1, itemStatus: 1, sku: 1, amount: 1, attributes: 1, sellingPrice: 1, orderPlacedAt: 1,
                        orderShippedAt: 1, orderCanceledAt: 1, orderDispatchedAt: 1, isRefunded: 1
                    }
                }
            ]);
            NodeCache.saveCache(`${authEmail}_myOrders`, orders);
        }
        return res.status(200).send({ success: true, statusCode: 200, data: { module: { orders } } });
    }
    catch (error) {
        next(error);
    }
});
module.exports.removeOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, orderID } = req.params;
        const result = yield Order.findOneAndDelete({ $and: [{ order_id: orderID }, { "customer.email": email }] });
        if (!result)
            throw new apiResponse.Api400Error("Order removed failed !");
        return res.status(200).send({ success: true, statusCode: 200, message: "Order Removed successfully" });
    }
    catch (error) {
        next(error);
    }
});
module.exports.cancelMyOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.params.email;
        const { cancelReason, orderID, product } = req === null || req === void 0 ? void 0 : req.body;
        if (!orderID || typeof orderID !== "string")
            throw new apiResponse.Api400Error("Required order ID !");
        if (!cancelReason || typeof cancelReason !== "string")
            throw new apiResponse.Api400Error("Required cancel reason !");
        if (!product)
            throw new apiResponse.Api400Error("Required order items information !");
        // calling parallel api 
        const [orderStatusResult, variationResult, emailSendingResult] = yield Promise.all([
            order_status_updater({ customerEmail: email, sellerEmail: product === null || product === void 0 ? void 0 : product.sellerEmail, orderID, type: "canceled", cancelReason }),
            update_variation_stock_available("inc", product),
            email_service({
                to: email,
                subject: "Order canceled confirm",
                html: `
          <h3>
            Order canceled with ID : ${orderID}
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
          </ul>`
            })
        ]);
        return orderStatusResult && res.status(200).send({ success: true, statusCode: 200, message: "Order canceled successfully" });
    }
    catch (error) {
        next(error);
    }
});
module.exports.orderDetails = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req === null || req === void 0 ? void 0 : req.decoded;
        const { orderId, itemId } = req === null || req === void 0 ? void 0 : req.params;
        if (!orderId || !itemId)
            throw new apiResponse.Api400Error("Required order id and item id !");
        let order;
        let orderDetailsInCache = NodeCache.getCache(`${email}_orderDetails`);
        if (orderDetailsInCache) {
            order = orderDetailsInCache;
        }
        else {
            order = yield Order.findOne({ _id: ObjectId(orderId) });
            NodeCache.saveCache(`${email}_orderDetails`, order);
        }
        if (!order)
            throw new apiResponse.Api404Error("Sorry order not found !");
        return res.status(200).send({ success: true, statusCode: 200, order });
    }
    catch (error) {
        next(error);
    }
});
