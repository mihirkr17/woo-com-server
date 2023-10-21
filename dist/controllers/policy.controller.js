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
const { Api500Error } = require("../errors/apiResponse");
const PrivacyPolicy = require("../model/privacyPolicy.model");
const NodeCache = require("../utils/NodeCache");
module.exports.privacyPolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pCache = NodeCache.getCache(`privacyPolicy`);
        let privacyPolicy;
        if (pCache) {
            privacyPolicy = pCache;
        }
        else {
            privacyPolicy = yield PrivacyPolicy.findOne({});
            NodeCache.saveCache(`privacyPolicy`, privacyPolicy);
        }
        res
            .status(200)
            .send({ success: true, statusCode: 200, data: privacyPolicy });
    }
    catch (error) {
        next(error);
    }
});
module.exports.updatePolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const policyId = req.params.policyId;
        const body = req.body;
        const result = yield PrivacyPolicy.findOneAndUpdate({ _id: ObjectId(policyId) }, { $set: body }, { upsert: true });
        if (result) {
            NodeCache.deleteCache(`privacyPolicy`);
            return res
                .status(200)
                .send({
                success: true,
                statusCode: 200,
                message: "Policy updated successfully",
            });
        }
        else {
            throw new Api500Error("Update failed !");
        }
    }
    catch (error) {
        next(error);
    }
});
