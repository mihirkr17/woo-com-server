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
// common.services.tsx
const mdb = require("mongodb");
const Product = require("../model/product.model");
const UserModel = require("../model/user.model");
const OrderModel = require("../model/order.model");
// Services
module.exports.updateProductVariationAvailability = (productID, variationID, quantity, action) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield Product.findOne({
        _id: mdb.ObjectId(productID)
    });
    if (product) {
        const targetVariation = product === null || product === void 0 ? void 0 : product.variations.filter((v) => (v === null || v === void 0 ? void 0 : v._VID) === variationID)[0];
        let available = targetVariation === null || targetVariation === void 0 ? void 0 : targetVariation.available;
        let restAvailable;
        if (action === "inc") {
            restAvailable = available + quantity;
        }
        if (action === "dec") {
            restAvailable = available - quantity;
        }
        let stock = restAvailable <= 1 ? "out" : "in";
        const result = yield Product.updateOne({ _id: mdb.ObjectId(productID) }, {
            $set: {
                "variations.$[i].available": restAvailable,
                "variations.$[i].stock": stock
            }
        }, {
            arrayFilters: [{ 'i._VID': variationID }]
        });
    }
});
module.exports.findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return (yield UserModel.findOne({ $and: [{ email: email }, { accountStatus: 'active' }] }, {
            password: 0,
            createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
        })) || null;
    }
    catch (error) {
        return error;
    }
});
module.exports.order_status_updater = (obj) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerEmail, type, orderID, trackingID, cancelReason } = obj;
        let setQuery;
        const timestamp = Date.now();
        let timePlan = {
            iso: new Date(timestamp),
            time: new Date(timestamp).toLocaleTimeString(),
            date: new Date(timestamp).toDateString(),
            timestamp: timestamp
        };
        if (type === "dispatch") {
            setQuery = {
                $set: {
                    "orders.$[i].orderStatus": "dispatch",
                    "orders.$[i].orderDispatchAT": timePlan,
                    "orders.$[i].isDispatch": true
                }
            };
        }
        else if (type === "shipped") {
            setQuery = {
                $set: {
                    "orders.$[i].orderStatus": "shipped",
                    "orders.$[i].orderShippedAT": timePlan,
                    "orders.$[i].isShipped": true
                }
            };
        }
        else if (type === "completed") {
            setQuery = {
                $set: {
                    "orders.$[i].orderStatus": "completed",
                    "orders.$[i].orderCompletedAT": timePlan,
                    "orders.$[i].isCompleted": true
                }
            };
        }
        else if (type === "canceled" && cancelReason) {
            setQuery = {
                $set: {
                    "orders.$[i].orderStatus": "canceled",
                    "orders.$[i].cancelReason": cancelReason,
                    "orders.$[i].orderCanceledAT": timePlan,
                    "orders.$[i].isCanceled": true
                }
            };
        }
        return (yield OrderModel.findOneAndUpdate({ user_email: customerEmail }, setQuery, {
            arrayFilters: [{ "i.orderID": orderID, "i.trackingID": trackingID }],
        })) ? { success: true } : { success: false };
    }
    catch (error) {
        return error === null || error === void 0 ? void 0 : error.message;
    }
});
