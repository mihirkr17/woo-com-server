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
module.exports.findUserByUUID = (uuid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return (yield UserModel.findOne({ $and: [{ _uuid: uuid }, { accountStatus: 'active' }] }, {
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
        const { customerEmail, type, orderID, cancelReason, refundAT, sellerEmail, items } = obj;
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
            //          "items.$[i].trackingID": generateTrackingID()
            //       }
            //    },
            //       { arrayFilters: [{ "i.itemID": item?.itemID }], upsert: true });
            // }));
            setQuery = {
                $set: {
                    orderStatus: "dispatch",
                    orderDispatchAT: timePlan,
                    isDispatch: true,
                    trackingID: generateTrackingID()
                }
            };
        }
        else if (type === "shipped") {
            setQuery = {
                $set: {
                    orderStatus: "shipped",
                    orderShippedAT: timePlan,
                    isShipped: true
                }
            };
        }
        else if (type === "completed") {
            setQuery = {
                $set: {
                    orderStatus: "completed",
                    orderCompletedAT: timePlan,
                    isCompleted: true
                }
            };
        }
        else if (type === "canceled" && cancelReason) {
            setQuery = {
                $set: {
                    orderStatus: "canceled",
                    cancelReason: cancelReason,
                    orderCanceledAT: timePlan,
                    isCanceled: true
                }
            };
        }
        else if (type === "refunded" && refundAT) {
            setQuery = {
                $set: {
                    isRefunded: true,
                    refundAT: refundAT,
                    orderStatus: "refunded"
                }
            };
        }
        return yield OrderTable.findOneAndUpdate({
            $and: [
                { customerEmail }, { orderID },
                { "seller.email": sellerEmail }
            ]
        }, setQuery, { upsert: true });
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
            { $match: { $and: [{ "variations._vrid": data === null || data === void 0 ? void 0 : data.variationID }] } },
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
        let available = 0;
        if (!type) {
            return;
        }
        if (!data) {
            return;
        }
        const { productID, variationID, listingID, quantity } = data;
        let variation = yield Product.aggregate([
            { $match: { $and: [{ _lid: listingID }, { _id: mdb.ObjectId(productID) }] } },
            { $unwind: { path: "$variations" } },
            { $project: { variations: 1 } },
            { $match: { $and: [{ "variations._vrid": variationID }] } },
            { $replaceRoot: { newRoot: { $mergeObjects: ["$variations", "$$ROOT"] } } },
            { $unset: ["variations"] }
        ]);
        variation = variation[0];
        if (type === "inc") {
            available = parseInt(variation === null || variation === void 0 ? void 0 : variation.available) + parseInt(quantity);
        }
        else if (type === "dec") {
            available = parseInt(variation === null || variation === void 0 ? void 0 : variation.available) - parseInt(quantity);
        }
        let stock = available <= 0 ? "out" : "in";
        return (yield Product.findOneAndUpdate({ $and: [{ _id: mdb.ObjectId(productID) }, { _lid: listingID }] }, {
            $set: {
                "variations.$[i].available": available,
                "variations.$[i].stock": stock
            }
        }, { arrayFilters: [{ "i._vrid": variationID }] })) || null;
    }
    catch (error) {
        return error === null || error === void 0 ? void 0 : error.message;
    }
});
module.exports.getSellerInformationByID = (uuid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield UserModel.aggregate([
            { $match: { _uuid: uuid } },
            {
                $project: {
                    email: 1,
                    fullName: 1,
                    contactEmail: 1,
                    dob: 1,
                    gender: 1,
                    phone: 1,
                    phonePrefixCode: 1,
                    taxId: "$seller.taxId",
                    address: "$seller.address",
                    storeInfos: "$seller.storeInfos"
                }
            }
        ]);
        return result[0] || null;
    }
    catch (error) {
        return error;
    }
});
module.exports.calculateShippingCost = (volWeight, areaType = "") => {
    // let n = 0; // price initial 0.5 kg = 0.5 dollar
    let charge;
    // let arr = [];
    // if (volWeight <= 3) {
    //    charge = areaType === "local" ? 0.5 : areaType === "zonal" ? 0.8 : 0.8;
    // }
    // else if (volWeight > 3 && volWeight <= 8) {
    //    charge = areaType === "local" ? 0.4 : areaType === "zonal" ? 0.7 : 0.7;
    // }
    // else if (volWeight > 8) {
    //    charge = areaType === "local" ? 0.3 : areaType === "zonal" ? 0.5 : 0.5;
    // }
    // do {
    //    n += 0.5;
    //    arr.push(n);
    // } while (n < volWeight);
    // let count = arr.length;
    // let sum = (count * charge).toFixed(0);
    // return parseInt(sum);
    volWeight = Math.ceil(volWeight);
    if (volWeight <= 1) {
        charge = areaType === "local" ? 10 : areaType === "zonal" ? 15 : 15;
    }
    else if (volWeight > 1 && volWeight <= 5) {
        charge = areaType === "local" ? 20 : areaType === "zonal" ? 25 : 25;
    }
    else if (volWeight > 5 && volWeight <= 10) {
        charge = areaType === "local" ? 30 : areaType === "zonal" ? 40 : 40;
    }
    else if (volWeight > 10) {
        charge = areaType === "local" ? 50 : areaType === "zonal" ? 60 : 60;
    }
    return charge;
};
module.exports.is_product = (productID, variationID) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return (yield Product.countDocuments({
            $and: [
                { _id: mdb.ObjectId(productID) },
                { variations: { $elemMatch: { _vrid: variationID } } }
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
                let isSaveAs;
                if (saveAs) {
                    isSaveAs = { 'save_as': saveAs };
                }
                else {
                    isSaveAs = {};
                }
                if (sellerInfo) {
                    f = {
                        $and: [
                            isSaveAs,
                            { 'sellerData.storeName': sellerInfo === null || sellerInfo === void 0 ? void 0 : sellerInfo.storeName },
                            { 'sellerData.sellerID': sellerInfo === null || sellerInfo === void 0 ? void 0 : sellerInfo._uuid }
                        ]
                    };
                }
                else {
                    f = isSaveAs;
                }
                return yield Product.countDocuments(f);
            });
        }
        let totalProducts = yield cps();
        let productInFulfilled = yield cps("fulfilled");
        let productInDraft = yield cps("draft");
        const setData = yield UserModel.updateOne({ $and: [{ _uuid: sellerInfo === null || sellerInfo === void 0 ? void 0 : sellerInfo._uuid }, { role: 'SELLER' }] }, {
            $set: {
                "seller.storeInfos.numOfProduct": totalProducts,
                "seller.storeInfos.productInFulfilled": productInFulfilled,
                "seller.storeInfos.productInDraft": productInDraft
            }
        }, {});
        if (setData)
            return true;
    }
    catch (error) {
        return error;
    }
});
module.exports.checkProductAvailability = (productID, variationID) => __awaiter(void 0, void 0, void 0, function* () {
    let product = yield Product.aggregate([
        { $match: { _id: mdb.ObjectId(productID) } },
        { $unwind: { path: "$variations" } },
        {
            $project: {
                _vrid: "$variations._vrid",
                available: "$variations.available",
                stock: "$variations.stock"
            }
        },
        { $match: { $and: [{ _vrid: variationID }, { available: { $gte: 1 } }, { stock: 'in' }] } }
    ]);
    product = product[0];
    return product;
});
module.exports.clearCart = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield ShoppingCartModel.findOneAndUpdate({ customerEmail: email }, {
            $set: { items: [] }
        });
    }
    catch (error) {
        return error;
    }
});
