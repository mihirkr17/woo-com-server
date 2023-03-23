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
const Order = require("../../model/order.model");
const { order_status_updater, update_variation_stock_available } = require("../../services/common.service");
module.exports.myOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.params.email;
        const authEmail = req.decoded.email;
        if (email !== authEmail) {
            return res.status(401).send();
        }
        let result = yield Order.aggregate([
            { $match: { $and: [{ user_email: email }] } },
            { $unwind: { path: "$orders" } },
            { $replaceRoot: { newRoot: "$orders" } }
        ]);
        res.status(200).send({ success: true, statusCode: 200, data: { module: { orders: result } } });
    }
    catch (error) {
        next(error);
    }
});
module.exports.removeOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderUserEmail = req.params.email;
        const id = parseInt(req.params.orderId);
        const result = yield Order.findOneAndUpdate({ user_email: orderUserEmail }, { $pull: { orders: { orderId: id } } });
        res.status(200).send({ result, message: "Order Removed successfully" });
    }
    catch (error) {
        next(error);
    }
});
module.exports.cancelMyOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userEmail = req.params.userEmail;
        const body = req.body;
        const { cancelReason, orderID } = body;
        if (!orderID)
            throw new Error("Required order ID !");
        if (!cancelReason)
            throw new Error("Required cancel reason !");
        let existOrder = yield Order.aggregate([
            { $match: { user_email: userEmail } },
            { $unwind: { path: "$orders" } },
            {
                $replaceRoot: { newRoot: "$orders" }
            },
            {
                $match: { $and: [{ orderID: orderID }] }
            }
        ]);
        existOrder = existOrder[0];
        if (existOrder) {
            yield order_status_updater({ type: "canceled", cancelReason, customerEmail: existOrder === null || existOrder === void 0 ? void 0 : existOrder.customerEmail, trackingID: existOrder === null || existOrder === void 0 ? void 0 : existOrder.trackingID });
            yield update_variation_stock_available("inc", existOrder);
        }
        return res.status(200).send({ success: true, statusCode: 200, message: "Order canceled successfully" });
    }
    catch (error) {
        next(error);
    }
});
