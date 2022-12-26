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
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const { cartTemplate } = require("../../templates/cart.template");
const checkProductAvailability = (productId, variationId) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbConnection();
    let product = yield db.collection('products').aggregate([
        { $match: { _id: ObjectId(productId) } },
        { $unwind: { path: "$variations" } },
        { $match: { $and: [{ 'variations.vId': variationId }, { 'variations.available': { $gte: 1 } }, { 'variations.stock': 'in' }] } }
    ]).toArray();
    product = product[0];
    return product;
});
const responseSender = (res, success, message, data = null) => {
    return success
        ? res.status(200).send({ success: true, statusCode: 200, message, data })
        : res.status(400).send({
            success: false,
            statusCode: 400,
            error: message,
        });
};
const saveToDBHandler = (filter, documents) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbConnection();
    return yield db.collection("users").updateOne(filter, documents, {
        upsert: true,
    });
});
