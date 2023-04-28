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
const { order_status_updater, update_variation_stock_available } = require("../../services/common.service");
const Product = require("../../model/product.model");
const OrderTableModel = require("../../model/orderTable.model");
module.exports.manageOrders = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = req.query.filters;
        const storeName = req.params.storeName;
        const uuid = req.decoded._uuid;
        const email = req.decoded.email;
        let result;
        let f = {};
        if (filters) {
            f = { $and: [{ "seller.store": storeName }, { "seller.email": email }, { orderStatus: filters }] };
        }
        else {
            f = { $and: [{ "seller.store": storeName }, { "seller.email": email }] };
        }
        const orders = yield OrderTableModel.find(f).sort({ _id: -1 });
        let orderCounter = yield OrderTableModel.aggregate([
            { $match: { $and: [{ "seller.store": storeName }, { "seller.email": email }] } },
            {
                $group: {
                    _id: "$seller.email",
                    placeOrderCount: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$orderStatus", "placed"] }, then: 1, else: 0
                            }
                        }
                    },
                    dispatchOrderCount: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$orderStatus", "dispatch"] }, then: 1, else: 0
                            }
                        }
                    },
                    totalOrderCount: {
                        $count: {}
                    }
                }
            }
        ]);
        orderCounter = orderCounter[0];
        return res.status(200).send({
            success: true, statusCode: 200, data: {
                module: result,
                placeOrderCount: orderCounter === null || orderCounter === void 0 ? void 0 : orderCounter.placeOrderCount,
                dispatchOrderCount: orderCounter === null || orderCounter === void 0 ? void 0 : orderCounter.dispatchOrderCount,
                totalOrderCount: orderCounter === null || orderCounter === void 0 ? void 0 : orderCounter.totalOrderCount, orders
            }
        });
    }
    catch (error) {
        next(error);
    }
});
module.exports.orderStatusManagement = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const storeName = req.params.storeName;
        if (!storeName)
            throw new Error("Required store name in param !");
        if (!body)
            throw new Error("Required body information about orders !");
        const { type, customerEmail, orderID, cancelReason, sellerEmail, items } = body;
        if (!type || type === "")
            throw new Error("Required status type !");
        if (!customerEmail || customerEmail === "")
            throw new Error("Required customer email !");
        if (!orderID || orderID === "")
            throw new Error("Required Order ID !");
        const result = yield order_status_updater({
            type: type,
            customerEmail,
            orderID,
            cancelReason,
            sellerEmail,
            items
        });
        if (result) {
            if (type === "canceled" && cancelReason && Array.isArray(items)) {
                yield Promise.all(items.map((item) => __awaiter(void 0, void 0, void 0, function* () { return yield update_variation_stock_available("inc", item); })));
            }
            return res.status(200).send({ success: true, statusCode: 200, message: "Order status updated to " + type });
        }
    }
    catch (error) {
        next(error);
    }
});
