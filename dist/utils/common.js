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
const { ObjectId } = require("mongodb");
const { dbConnection } = require("./db");
module.exports.updateProductStock = (productId, quantity, action) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbConnection();
    const products = yield db.collection("products").findOne({
        _id: ObjectId(productId),
    });
    let availableProduct = products === null || products === void 0 ? void 0 : products.available;
    let restAvailable;
    if (action === "inc") {
        restAvailable = availableProduct + quantity;
    }
    if (action === "dec") {
        restAvailable = availableProduct - quantity;
    }
    let stock = restAvailable <= 1 ? "out" : "in";
    yield db.collection("products").updateOne({ _id: ObjectId(productId) }, { $set: { available: restAvailable, stock } }, { upsert: true });
});
