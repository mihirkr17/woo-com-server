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
var conn = require("../utils/db");
var mongodb = require("mongodb");
const mng = require("mongodb");
const User = require("./user.model");
const ProductTable = require("./product.model");
module.exports.productCounter = (sellerInfo) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let db = yield conn.dbConnection();
        const productCollection = yield db.collection('products');
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
                            { 'sellerData.sellerID': sellerInfo === null || sellerInfo === void 0 ? void 0 : sellerInfo._UUID }
                        ]
                    };
                }
                else {
                    f = isSaveAs;
                }
                return productCollection.countDocuments(f);
            });
        }
        let totalProducts = yield cps();
        let productInFulfilled = yield cps("fulfilled");
        let productInDraft = yield cps("draft");
        const setData = yield User.updateOne({ $and: [{ _UUID: sellerInfo === null || sellerInfo === void 0 ? void 0 : sellerInfo._UUID }, { role: 'SELLER' }] }, {
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
module.exports.findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return (yield User.countDocuments({ email })) || false;
    }
    catch (error) {
        return error;
    }
});
module.exports.checkProductAvailability = (productID, variationID) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield conn.dbConnection();
    let product = yield db.collection('products').aggregate([
        { $match: { _id: mng.ObjectId(productID) } },
        { $unwind: { path: "$variations" } },
        {
            $project: {
                _VID: "$variations._VID",
                available: "$variations.available",
                stock: "$variations.stock"
            }
        },
        { $match: { $and: [{ _VID: variationID }, { available: { $gte: 1 } }, { stock: 'in' }] } }
    ]).toArray();
    product = product[0];
    return product;
});
