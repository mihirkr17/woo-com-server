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
