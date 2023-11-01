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
const ShoppingCartModel = require("../model/shoppingCart.model");
const cryptos = require("crypto");
const apiResponse = require("../errors/apiResponse");
const { generateTrackingID } = require("../utils/generator");
const NCache = require("../utils/NodeCache");
const Order = require("../model/order.model");
const Store = require("../model/store.model");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
module.exports.findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield UserModel.findOne({ $and: [{ email: email }, { accountStatus: 'Active' }] }, {
            password: 0,
            createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
        });
    }
    catch (error) {
        throw error;
    }
});
/**
 * @params {id} user _id
 */
module.exports.findUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield UserModel.findOne({ $and: [{ _id: mdb.ObjectId(id) }, { accountStatus: 'Active' }] }, {
            password: 0,
            createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
        });
    }
    catch (error) {
        throw error;
    }
});
module.exports.orderStatusUpdater = (obj) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerEmail, customerId, type, orderID, cancelReason, refundAT } = obj;
        let setQuery = {};
        const timestamp = Date.now();
        if (type === "dispatch") {
            setQuery = {
                $set: {
                    orderStatus: "dispatch",
                    orderDispatchedAt: new Date(timestamp),
                    trackingId: generateTrackingID()
                }
            };
        }
        else if (type === "shipped") {
            setQuery = {
                $set: {
                    orderStatus: "shipped",
                    orderShippedAt: new Date(timestamp)
                }
            };
        }
        else if (type === "completed") {
            setQuery = {
                $set: {
                    orderStatus: "completed",
                    orderCompletedAt: new Date(timestamp)
                }
            };
        }
        else if (type === "canceled" && cancelReason) {
            setQuery = {
                $set: {
                    orderStatus: "canceled",
                    cancelReason: cancelReason,
                    orderCanceledAt: new Date(timestamp)
                }
            };
        }
        else if (type === "refunded" && refundAT) {
            setQuery = {
                $set: {
                    isRefunded: true,
                    refundAt: refundAT,
                    orderStatus: "refunded"
                }
            };
        }
        yield NCache.deleteCache(`${customerEmail}_myOrders`);
        return (yield Order.findOneAndUpdate({
            $and: [
                { customerId: customerId },
                { orderId: orderID }
            ]
        }, setQuery, { upsert: true })) ? true : false;
    }
    catch (error) {
        throw error;
    }
});
module.exports.productStockUpdater = (type, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!type)
            throw new Error("Required action !");
        if (!data || !Array.isArray(data))
            throw new apiResponse.Api500Error("Required product id, sku, quantity !");
        const bulkOperations = [];
        for (const item of data) {
            const filter = {
                _id: mdb.ObjectId(item.productId),
            };
            const update = [
                {
                    $set: {
                        variations: {
                            $map: {
                                input: '$variations',
                                as: 'var',
                                in: {
                                    $cond: {
                                        if: { $eq: ['$$var.sku', item.sku] },
                                        then: {
                                            $mergeObjects: [
                                                '$$var',
                                                {
                                                    available: {
                                                        $cond: {
                                                            if: { $eq: [type, 'dec'] },
                                                            then: { $max: [0, { $subtract: ['$$var.available', item.quantity] }] },
                                                            else: { $add: ['$$var.available', item.quantity] },
                                                        },
                                                    },
                                                    stock: {
                                                        $cond: {
                                                            if: { $lte: [{ $max: [0, { $subtract: ['$$var.available', item.quantity] }] }, 0] },
                                                            then: 'out',
                                                            else: '$$var.stock',
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                        else: '$$var',
                                    },
                                },
                            },
                        },
                    },
                },
            ];
            // Push an updateOne operation into the bulkOperations array
            bulkOperations.push({
                updateOne: {
                    filter,
                    update,
                },
            });
        }
        // Execute the bulkWrite operation with the update operations
        return yield Product.bulkWrite(bulkOperations);
    }
    catch (error) {
        throw error;
    }
});
module.exports.getSupplierInformationByID = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Store.find({ userId: mdb.ObjectId(id) });
    }
    catch (error) {
        throw error;
    }
});
module.exports.checkProductAvailability = (productID, sku) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let product = yield Product.aggregate([
            { $match: { _id: mdb.ObjectId(productID) } },
            { $unwind: { path: "$variations" } },
            {
                $project: {
                    sku: "$variations.sku",
                    available: "$variations.available",
                    stock: "$variations.stock"
                }
            },
            { $match: { $and: [{ sku }, { available: { $gte: 1 } }, { stock: 'in' }] } }
        ]);
        product = product[0];
        return product;
    }
    catch (error) {
        throw error;
    }
});
module.exports.clearCart = (customerId, customerEmail) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield NCache.deleteCache(`${customerEmail}_cartProducts`);
        return yield ShoppingCartModel.deleteMany({ customerId: mdb.ObjectId(customerId) });
    }
    catch (error) {
        throw error;
    }
});
module.exports.updateProductPerformance = (product, actionType) => __awaiter(void 0, void 0, void 0, function* () {
    const { _id, views, ratingAverage, sales } = product;
    let viewsWeight = 0.4;
    let ratingWeight = 0.5;
    let salesWeight = 0.3;
    try {
        return yield Product.findOneAndUpdate({ $and: [{ _id: mdb.ObjectId(_id) }, { status: "Active" }] }, [
            {
                $set: {
                    views: actionType === "views" ? { $add: [{ $ifNull: ["$views", 0] }, 1] } : "$views",
                    sales: actionType === "sales" ? { $add: [{ $ifNull: ["$sales", 0] }, 1] } : "$sales",
                    score: {
                        $add: [
                            { $multiply: ["$views", viewsWeight] },
                            { $multiply: [{ $ifNull: ["$ratingAverage", 0] }, ratingWeight] },
                            { $multiply: [{ $ifNull: ["$sales", 0] }, salesWeight] },
                        ]
                    },
                },
            }
        ], { upsert: true, new: true });
    }
    catch (error) {
        throw error;
    }
});
module.exports.createPaymentIntents = (totalAmount, orderId, paymentMethodId, session, ip, userAgent) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentIntent = yield stripe.paymentIntents.create({
            amount: (totalAmount * 100),
            currency: 'bdt',
            metadata: {
                order_id: orderId
            },
            confirm: true,
            automatic_payment_methods: { enabled: true },
            payment_method: paymentMethodId,
            return_url: 'https://example.com/order/123/complete',
            use_stripe_sdk: true,
            mandate_data: {
                customer_acceptance: {
                    type: "online",
                    online: {
                        ip_address: ip,
                        user_agent: userAgent //req.get("user-agent"),
                    },
                },
            },
        }, { idempotencyKey: session });
        return paymentIntent;
    }
    catch (error) {
        throw error;
    }
});
