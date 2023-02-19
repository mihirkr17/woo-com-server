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
module.exports.manageOrders = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storeName = req.params.storeName;
        const uuid = req.decoded._UUID;
        let result;
        if (storeName) {
            result = yield Order.aggregate([
                { $unwind: "$orders" },
                { $replaceRoot: { newRoot: "$orders" } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'listingID',
                        foreignField: "_LID",
                        as: "main_product"
                    }
                },
                { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
                {
                    $match: {
                        $and: [{ "sellerData.storeName": storeName }, { "sellerData.sellerID": uuid }],
                    },
                },
                {
                    $unset: [
                        'bodyInfo', 'main_product',
                        "modifiedAt", "paymentInfo",
                        "variations", "_id", "tax", "save_as", "reviews",
                        "ratingAverage", "_LID", "specification", "rating", "isVerified", "createdAt", "categories"
                    ]
                }
            ]);
        }
        ;
        let newOrderCount = result && result.filter((o) => (o === null || o === void 0 ? void 0 : o.orderStatus) === "pending").length;
        let totalOrderCount = result && result.length;
        return res.status(200).send({ success: true, statusCode: 200, data: { module: result, newOrderCount, totalOrderCount } });
    }
    catch (error) {
        next(error);
    }
});
module.exports.dispatchOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const body = req.body;
        if (((_a = body === null || body === void 0 ? void 0 : body.context) === null || _a === void 0 ? void 0 : _a.MARKET_PLACE) !== "WooKart") {
            throw new Error("Invalid operation !");
        }
        if (!(body === null || body === void 0 ? void 0 : body.module)) {
            throw new Error("Invalid operation !");
        }
        const { trackingID, orderID, customerEmail } = body && (body === null || body === void 0 ? void 0 : body.module);
        const timestamp = Date.now();
        let dispatchTime = {
            iso: new Date(timestamp),
            time: new Date(timestamp).toLocaleTimeString(),
            date: new Date(timestamp).toDateString(),
            timestamp: timestamp
        };
        yield Order.findOneAndUpdate({ user_email: customerEmail }, {
            $set: {
                "orders.$[i].orderStatus": "dispatch",
                "orders.$[i].orderDispatchAT": dispatchTime,
                "orders.$[i].isDispatch": true
            },
        }, {
            arrayFilters: [{ "i.orderID": orderID, "i.trackingID": trackingID }],
        });
        res.status(200).send({ success: true, statusCode: 200, message: "Successfully order dispatched" });
    }
    catch (error) {
        next(error);
    }
});
