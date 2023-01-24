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
const User = require("../../../model/user.model");
const response = require("../../../errors/apiResponse");
module.exports.updateProfileData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.decoded.email;
        const clientEmail = req.headers.authorization || "";
        if (clientEmail !== email) {
            throw new response.Api403Error("AuthError", "Invalid email address !");
        }
        const result = yield User.updateOne({ email: email }, { $set: req.body }, { new: true });
        if ((result === null || result === void 0 ? void 0 : result.matchedCount) === 1) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Profile updated." });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.makeAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        if (!ObjectId.isValid(userId)) {
            return res
                .status(400)
                .send({ success: false, error: "User ID not valid" });
        }
        const result = yield User.updateOne({ _id: ObjectId(userId) }, { $set: { role: "ADMIN" } }, { new: true });
        return result
            ? res.status(200).send({ success: true, message: "Permission granted" })
            : res.status(500).send({ success: false, error: "Failed" });
    }
    catch (error) {
        next(error);
    }
});
module.exports.demoteToUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        if (!ObjectId.isValid(userId)) {
            return res.status(400).send({ error: "User Id is not valid" });
        }
        res
            .status(200)
            .send(yield User.updateOne({ _id: ObjectId(userId) }, { $set: { role: "BUYER" } }, { new: true }));
    }
    catch (error) {
        next(error);
    }
});
module.exports.makeSellerRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        const authRole = req.decoded.role;
        let user = yield User.findOne({ $and: [{ email: authEmail }, { role: 'BUYER' }] });
        if (!user) {
            return res.status(404).send({ success: false, statusCode: 404, error: 'User not found' });
        }
        if ((user === null || user === void 0 ? void 0 : user.isSeller) === 'pending') {
            return res.status(200).send({
                success: false,
                statusCode: 200,
                error: 'You already send a seller request. We are working for your request, and it will take sometime to verify'
            });
        }
        let body = req.body;
        let businessInfo = {
            taxID: body === null || body === void 0 ? void 0 : body.taxID,
            stateTaxID: body === null || body === void 0 ? void 0 : body.stateTaxID,
            creditCard: body === null || body === void 0 ? void 0 : body.creditCard,
        };
        let sellerInfo = {
            fName: body === null || body === void 0 ? void 0 : body.fName,
            lName: body === null || body === void 0 ? void 0 : body.lName,
            dateOfBirth: body === null || body === void 0 ? void 0 : body.dateOfBirth,
            phone: body === null || body === void 0 ? void 0 : body.phone,
            address: {
                street: body === null || body === void 0 ? void 0 : body.street,
                thana: body === null || body === void 0 ? void 0 : body.thana,
                district: body === null || body === void 0 ? void 0 : body.district,
                state: body === null || body === void 0 ? void 0 : body.state,
                country: body === null || body === void 0 ? void 0 : body.country,
                pinCode: body === null || body === void 0 ? void 0 : body.pinCode
            }
        };
        let inventoryInfo = {
            earn: 0,
            totalSell: 0,
            totalProducts: 0,
            storeName: body === null || body === void 0 ? void 0 : body.storeName,
            storeCategory: body === null || body === void 0 ? void 0 : body.categories,
            storeAddress: {
                street: body === null || body === void 0 ? void 0 : body.street,
                thana: body === null || body === void 0 ? void 0 : body.thana,
                district: body === null || body === void 0 ? void 0 : body.district,
                state: body === null || body === void 0 ? void 0 : body.state,
                country: body === null || body === void 0 ? void 0 : body.country,
                pinCode: body === null || body === void 0 ? void 0 : body.pinCode
            }
        };
        let isUpdate = yield User.updateOne({ $and: [{ email: authEmail }, { role: authRole }] }, { $set: { businessInfo, sellerInfo, inventoryInfo, isSeller: 'pending' } }, { new: true });
        if (isUpdate) {
            return res
                .status(200)
                .send({ success: true, statusCode: 200, message: "Thanks for sending a seller request. We are working for your request" });
        }
    }
    catch (error) {
        next(error);
    }
});
// Permit the seller request
module.exports.permitSellerRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(',')[0];
        const UUID = (_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(',')[1];
        const userEmail = (_c = req.headers.authorization) === null || _c === void 0 ? void 0 : _c.split(',')[2];
        const user = yield User.findOne({ $and: [{ email: userEmail }, { _id: userId }, { _UUID: UUID }, { isSeller: 'pending' }] });
        // console.log(user);
        if (!user) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'Sorry! request user not found.' });
        }
        let result = yield User.updateOne({
            $and: [{ email: userEmail }, { _UUID: UUID }, { isSeller: 'pending' }]
        }, {
            $set: { isSeller: 'fulfilled', accountStatus: 'active', becomeSellerAt: new Date() }
        }, { new: true });
        (result === null || result === void 0 ? void 0 : result.acknowledged)
            ? res.status(200).send({ success: true, statusCode: 200, message: "Request Success" })
            : res.status(400).send({ success: false, statusCode: 400, error: "Bad Request" });
    }
    catch (error) {
        next(error);
    }
});
