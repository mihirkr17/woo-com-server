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
const OrderTableModel = require("../../model/orderTable.model");
const { update_variation_stock_available } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const email_service = require("../../services/email.service");
module.exports.myOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.params.email;
        const authEmail = req.decoded.email;
        if (email !== authEmail) {
            return res.status(401).send();
        }
        const orders = yield OrderTableModel.find({ customerEmail: email }).sort({ _id: -1 });
        return res.status(200).send({ success: true, statusCode: 200, data: { module: { orders } } });
    }
    catch (error) {
        next(error);
    }
});
module.exports.removeOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, orderID } = req.params;
        const result = yield OrderTableModel.findOneAndDelete({ $and: [{ orderID }, { customerEmail: email }] });
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
        const { cancelReason, orderID, orderItems } = req === null || req === void 0 ? void 0 : req.body;
        if (!orderID || typeof orderID !== "string")
            throw new apiResponse.Api400Error("Required order ID !");
        if (!cancelReason || typeof cancelReason !== "string")
            throw new apiResponse.Api400Error("Required cancel reason !");
        if (!orderItems || !Array.isArray(orderItems))
            throw new apiResponse.Api400Error("Required order items information !");
        const timestamp = Date.now();
        let timePlan = {
            iso: new Date(timestamp),
            time: new Date(timestamp).toLocaleTimeString(),
            date: new Date(timestamp).toDateString(),
            timestamp: timestamp
        };
        const updateOrderStatusResult = yield OrderTableModel.findOneAndUpdate({ $and: [{ orderID }, { customerEmail: email }] }, {
            $set: {
                orderStatus: "canceled",
                cancelReason: cancelReason,
                orderCanceledAT: timePlan,
                isCanceled: true
            }
        });
        if (!updateOrderStatusResult)
            throw new apiResponse.Api400Error("Order canceled request failed !");
        yield Promise.all(orderItems.map((item) => __awaiter(void 0, void 0, void 0, function* () { return yield update_variation_stock_available("inc", item); })));
        yield email_service({
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
          ${orderItems === null || orderItems === void 0 ? void 0 : orderItems.map((item) => {
                return (`<li style="margin: 5px;">
            Title: ${item === null || item === void 0 ? void 0 : item.title}. <br />
            Price: ${item === null || item === void 0 ? void 0 : item.baseAmount} USD. <br />
            Qty: ${item === null || item === void 0 ? void 0 : item.quantity} pcs.
          </li>`);
            })}
        </ul>`
        });
        return res.status(200).send({ success: true, statusCode: 200, message: "Order canceled successfully" });
    }
    catch (error) {
        next(error);
    }
});
