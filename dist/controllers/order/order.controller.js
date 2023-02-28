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
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const { updateProductStock } = require("../../utils/common");
const { orderModel } = require("../../templates/order.template");
const Product = require("../../model/product.model");
const User = require("../../model/user.model");
const Order = require("../../model/order.model");
module.exports.myOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
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
        const db = yield dbConnection();
        const orderUserEmail = req.params.email;
        const id = parseInt(req.params.orderId);
        const result = yield db
            .collection("orders")
            .updateOne({ user_email: orderUserEmail }, { $pull: { orders: { orderId: id } } });
        res.status(200).send({ result, message: "Order Removed successfully" });
    }
    catch (error) {
        next(error);
    }
});
module.exports.cancelMyOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userEmail = req.params.userEmail;
        const { cancel_reason, orderID } = req.body;
        const timestamp = Date.now();
        let cancelTime = {
            iso: new Date(timestamp),
            time: new Date(timestamp).toLocaleTimeString(),
            date: new Date(timestamp).toDateString(),
            timestamp: timestamp
        };
        const result = yield Order.findOneAndUpdate({ user_email: userEmail }, {
            $set: {
                "orders.$[i].orderStatus": "canceled",
                "orders.$[i].cancelReason": cancel_reason,
                "orders.$[i].orderCanceledAT": cancelTime,
            },
        }, { arrayFilters: [{ "i.orderID": orderID }], upsert: true });
        if (result) {
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
            let products = yield Product.aggregate([
                { $match: { $and: [{ _LID: existOrder === null || existOrder === void 0 ? void 0 : existOrder.listingID }] } },
                { $unwind: { path: "$variations" } },
                {
                    $project: {
                        variations: 1
                    }
                },
                { $match: { $and: [{ "variations._VID": existOrder === null || existOrder === void 0 ? void 0 : existOrder.variationID }] } },
            ]);
            products = products[0];
            let availableProduct = (_a = products === null || products === void 0 ? void 0 : products.variations) === null || _a === void 0 ? void 0 : _a.available;
            let restAvailable = availableProduct + (existOrder === null || existOrder === void 0 ? void 0 : existOrder.quantity);
            let stock = restAvailable <= 0 ? "out" : "in";
            yield Product.findOneAndUpdate({ _id: ObjectId(existOrder === null || existOrder === void 0 ? void 0 : existOrder.productID) }, {
                $set: {
                    "variations.$[i].available": restAvailable,
                    "variations.$[i].stock": stock
                }
            }, { arrayFilters: [{ "i._VID": existOrder === null || existOrder === void 0 ? void 0 : existOrder.variationID }] });
        }
        res.send({ success: true, statusCode: 200, message: "Order canceled successfully" });
    }
    catch (error) {
        next(error);
    }
});
