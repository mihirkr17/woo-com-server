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
const apiResponse = require("../../errors/apiResponse");
module.exports.privacyPolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        res.status(200).send(yield db.collection("privacy-policy").findOne({}));
    }
    catch (error) {
        next(error);
    }
});
module.exports.updatePolicy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const policyId = req.params.policyId;
        const body = req.body;
        const result = yield db.collection("privacy-policy").updateOne({ _id: ObjectId(policyId) }, { $set: body }, { upsert: true });
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Policy updated successfully" });
        }
        else {
            throw new apiResponse.Api500Error("Update failed !");
        }
    }
    catch (error) {
        next(error);
    }
});
