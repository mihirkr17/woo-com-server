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
const { dbh } = require("../../utils/db");
const { ObjectId } = require("mongodb");
module.exports.privacyPolicy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productPolicy = dbh.db("Products").collection("policy");
        res.status(200).send(yield productPolicy.findOne({}));
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.updatePolicy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const productPolicy = dbh.db("Products").collection("policy");
        const policyId = req.params.policyId;
        const body = req.body;
        const result = yield productPolicy.updateOne({ _id: ObjectId(policyId) }, { $set: body }, { upsert: true });
        if (result) {
            return res.status(200).send({ message: "Policy updated successfully" });
        }
        else {
            return res.status(400).send({ message: "Update failed" });
        }
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
