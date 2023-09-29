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
const OrderTable = require("../model/orderTable.model");
const ShoppingCartModel = require("../model/shoppingCart.model");
const cryptos = require("crypto");
const apiResponse = require("../errors/apiResponse");
const { generateTrackingID } = require("../utils/generator");
const NCache = require("../utils/NodeCache");
const Order = require("../model/order.model");
const Supplier = require("../model/supplier.model");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
module.exports.findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return (yield UserModel.findOne({ $and: [{ email: email }, { accountStatus: 'Active' }] }, {
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
module.exports.findUserByUUID = (uuid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return (yield UserModel.findOne({ $and: [{ _uuid: uuid }, { accountStatus: 'Active' }] }, {
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
        const { customerEmail, type, orderID, cancelReason, refundAT, sellerEmail } = obj;
        let setQuery = {};
        const timestamp = Date.now();
        let timePlan = {
            iso: new Date(timestamp),
            time: new Date(timestamp).toLocaleTimeString(),
            date: new Date(timestamp).toDateString(),
            timestamp: timestamp
        };
        if (type === "dispatch") {
            // await Promise.all(items.map(async (item: any) => {
            //    return await OrderTable.findOneAndUpdate({
            //       $and: [
            //          { customerEmail }, { orderID },
            //          { "seller.email": sellerEmail }]
            //    }, {
            //       $set: {
            //          "items.$[i].tracking_id": generateTrackingID()
            //       }
            //    },
            //       { arrayFilters: [{ "i.itemID": item?.itemID }], upsert: true });
            // }));
            setQuery = {
                $set: {
                    order_status: "dispatch",
                    order_dispatched_at: timePlan,
                    is_dispatched: true,
                    tracking_id: generateTrackingID()
                }
            };
        }
        else if (type === "shipped") {
            setQuery = {
                $set: {
                    order_status: "shipped",
                    order_shipped_at: timePlan,
                    is_shipped: true
                }
            };
        }
        else if (type === "completed") {
            setQuery = {
                $set: {
                    order_status: "completed",
                    is_completed_at: timePlan,
                    is_completed: true
                }
            };
        }
        else if (type === "canceled" && cancelReason) {
            setQuery = {
                $set: {
                    order_status: "canceled",
                    cancel_reason: cancelReason,
                    order_canceled_at: timePlan,
                    is_canceled: true
                }
            };
        }
        else if (type === "refunded" && refundAT) {
            setQuery = {
                $set: {
                    is_refunded: true,
                    refund_at: refundAT,
                    order_status: "refunded"
                }
            };
        }
        yield NCache.deleteCache(`${customerEmail}_myOrders`);
        return (yield Order.findOneAndUpdate({
            $and: [
                { "customer.email": customerEmail },
                { order_id: orderID },
                { "supplier.email": sellerEmail }
            ]
        }, setQuery, { upsert: true })) ? true : false;
    }
    catch (error) {
        return error === null || error === void 0 ? void 0 : error.message;
    }
});
module.exports.get_product_variation = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let variation = yield Product.aggregate([
            { $match: { $and: [{ _lid: data === null || data === void 0 ? void 0 : data.listingID }, { _id: mdb.ObjectId(data === null || data === void 0 ? void 0 : data.productID) }] } },
            { $unwind: { path: "$variations" } },
            { $project: { variations: 1 } },
            { $match: { $and: [{ "variations.sku": data === null || data === void 0 ? void 0 : data.sku }] } },
            { $replaceRoot: { newRoot: { $mergeObjects: ["$variations", "$$ROOT"] } } },
            { $unset: ["variations"] }
        ]);
        if (variation) {
            return variation[0];
        }
    }
    catch (error) {
        return error;
    }
});
module.exports.update_variation_stock_available = (type, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!type) {
            throw new Error("Required action !");
        }
        if (!data || !Array.isArray(data)) {
            throw new apiResponse.Api500Error("Required product id, sku, quantity !");
            // throw new Error("Required product id, sku, quantity !");
        }
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
module.exports.getSupplierInformationByID = (uuid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Supplier.findOne({ _id: mdb.ObjectId(uuid) }, { password: 0 });
});
module.exports.is_product = (productID, sku) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return (yield Product.countDocuments({
            $and: [
                { _id: mdb.ObjectId(productID) },
                { variations: { $elemMatch: { sku } } }
            ]
        })) || 0;
    }
    catch (error) {
        return error;
    }
});
module.exports.productCounter = (sellerInfo) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        function cps(saveAs = "") {
            return __awaiter(this, void 0, void 0, function* () {
                let f;
                if (sellerInfo) {
                    f = {
                        "supplier.email": sellerInfo === null || sellerInfo === void 0 ? void 0 : sellerInfo.email
                    };
                }
                else {
                    f = {};
                }
                return yield Product.countDocuments(f);
            });
        }
        let totalProducts = yield cps();
        let inactiveProducts = yield cps("Inactive");
        const setData = yield UserModel.updateOne({ $and: [{ _uuid: sellerInfo === null || sellerInfo === void 0 ? void 0 : sellerInfo._uuid }, { role: 'SELLER' }] }, {
            $set: {
                "store.info.numOfProduct": totalProducts,
                "store.info.inactiveProducts": inactiveProducts
            }
        }, {});
        if (setData)
            return true;
    }
    catch (error) {
        return error;
    }
});
module.exports.checkProductAvailability = (productID, sku) => __awaiter(void 0, void 0, void 0, function* () {
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
});
module.exports.clearCart = (customerId, customerEmail) => __awaiter(void 0, void 0, void 0, function* () {
    yield NCache.deleteCache(`${customerEmail}_cartProducts`);
    return yield ShoppingCartModel.deleteMany({ customerId: mdb.ObjectId(customerId) });
});
module.exports.updateProductInformation = (product, option) => __awaiter(void 0, void 0, void 0, function* () {
    const { _id, views, ratingAverage, sales } = product;
    let viewsWeight = 0.4;
    let ratingWeight = 0.5;
    let salesWeight = 0.3;
    let totalViews = (option === null || option === void 0 ? void 0 : option.actionType) === "views" ? ((views !== null && views !== void 0 ? views : 0) + 1) : (views !== null && views !== void 0 ? views : 0);
    let totalSales = (option === null || option === void 0 ? void 0 : option.actionType) === "sales" ? (sales !== null && sales !== void 0 ? sales : 0) + 1 : (sales !== null && sales !== void 0 ? sales : 0);
    let score = (totalViews * viewsWeight) + (ratingAverage * ratingWeight) + (totalSales * salesWeight);
    try {
        yield Product.findOneAndUpdate({ $and: [{ _id: mdb.ObjectId(_id) }, { status: "Active" }] }, {
            $set: {
                views: totalViews,
                score: score
            }
        }, { upsert: true });
        return { request: "Request success..." };
    }
    catch (error) {
        return error;
    }
});
module.exports.createPaymentIntents = (totalAmount, orderId, paymentMethodId, session, ip, userAgent) => __awaiter(void 0, void 0, void 0, function* () {
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
});
