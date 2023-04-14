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
const ShoppingCartModel = require("../model/shoppingCart.model");
const cryptos = require("crypto");
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
        const { customerEmail, type, orderID, trackingID, cancelReason, refundAT } = obj;
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
        else if (type === "refunded" && refundAT) {
            setQuery = {
                $set: {
                    "orders.$[i].refund.isRefunded": true,
                    "orders.$[i].refund.refundAT": refundAT,
                    "orders.$[i].orderStatus": "refunded"
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
module.exports.actualSellingPrice = { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] };
module.exports.newPricing = {
    sellingPrice: { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] },
    price: "$pricing.price",
    discount: {
        $toInt: {
            $multiply: [
                {
                    $divide: [
                        { $subtract: ["$pricing.price", { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] }] },
                        "$pricing.price"
                    ]
                }, 100
            ]
        }
    }
};
module.exports.basicProductProject = {
    title: "$variations.vTitle",
    slug: 1,
    brand: 1,
    categories: 1,
    packageInfo: 1,
    rating: 1,
    ratingAverage: 1,
    _lid: 1,
    reviews: 1,
    image: { $first: "$images" },
    _vrid: "$variations._vrid",
    stock: "$variations.stock",
    variant: "$variations.variant",
    shipping: 1,
    pricing: {
        sellingPrice: { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] },
        price: "$pricing.price",
        discount: { $toInt: { $multiply: [{ $divide: [{ $subtract: ["$pricing.price", { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] }] }, "$pricing.price"] }, 100] } }
    }
};
module.exports.calculateShippingCost = (volWeight, areaType = "") => {
    let n = 0; // price initial 0.5 kg = 0.5 dollar
    let charge;
    let arr = [];
    if (volWeight <= 3) {
        charge = areaType === "local" ? 0.5 : areaType === "zonal" ? 0.8 : 0.8;
    }
    else if (volWeight > 3 && volWeight <= 8) {
        charge = areaType === "local" ? 0.4 : areaType === "zonal" ? 0.7 : 0.7;
    }
    else if (volWeight > 8) {
        charge = areaType === "local" ? 0.3 : areaType === "zonal" ? 0.5 : 0.5;
    }
    do {
        n += 0.5;
        arr.push(n);
    } while (n < volWeight);
    let count = arr.length;
    let sum = (count * charge).toFixed(0);
    return parseInt(sum);
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
module.exports.get_six_digit_random_number = () => {
    let randomBytes = cryptos.randomBytes(4);
    let randomNumber = parseInt(randomBytes.toString('hex'), 16) % 900000 + 100000;
    return randomNumber.toString();
};
module.exports.isPasswordValid = (password) => {
    return (/^(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{5,}$/).test(password);
};
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
