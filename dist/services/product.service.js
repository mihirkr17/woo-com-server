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
var { dbConnection } = require("../utils/db");
const { ObjectId } = require("mongodb");
module.exports.findProductsByLIdAndPId = (productId, _lId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        return yield db.collection('products').findOne({
            $and: [{ _id: ObjectId(productId) }, { _lId }]
        });
    }
    catch (error) {
        return error;
    }
});
module.exports.productStatusAndSaveAsUpdateBySeller = (body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const db = yield dbConnection();
        if ((_a = body === null || body === void 0 ? void 0 : body.data) === null || _a === void 0 ? void 0 : _a.vId) {
            return yield db.collection('products').updateOne({ $and: [{ _id: ObjectId((_b = body === null || body === void 0 ? void 0 : body.data) === null || _b === void 0 ? void 0 : _b.pId) }, { _lId: (_c = body === null || body === void 0 ? void 0 : body.data) === null || _c === void 0 ? void 0 : _c.lId }, { save_as: 'fulfilled' }] }, { $set: { 'variations.$[i].status': (_d = body === null || body === void 0 ? void 0 : body.data) === null || _d === void 0 ? void 0 : _d.action } }, { arrayFilters: [{ "i._vId": (_e = body === null || body === void 0 ? void 0 : body.data) === null || _e === void 0 ? void 0 : _e.vId }] });
        }
        else {
            return yield db.collection('products').updateOne({ $and: [{ _id: ObjectId((_f = body === null || body === void 0 ? void 0 : body.data) === null || _f === void 0 ? void 0 : _f.pId) }, { _lId: (_g = body === null || body === void 0 ? void 0 : body.data) === null || _g === void 0 ? void 0 : _g.lId }] }, { $set: { save_as: (_h = body === null || body === void 0 ? void 0 : body.data) === null || _h === void 0 ? void 0 : _h.action, "variations.$[].status": "inactive" } }, { upsert: true, multi: true });
        }
    }
    catch (error) {
        return error;
    }
});
