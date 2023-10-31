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
const User = require("../model/user.model");
const { BuyerMeta } = require("../model/usersmeta.model");
const { findUserByEmail } = require("../services/common.service");
const { Api400Error, Api404Error } = require("../errors/apiResponse");
const { generateUserDataToken } = require("../utils/generator");
const { ObjectId } = require("mongodb");
const NCache = require("../utils/NodeCache");
function createShippingAddress(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req.decoded;
            let body = req.body;
            if (!body || typeof body !== "object")
                throw new Api400Error("Required body !");
            if (!Object.values(body).some((e) => e !== null && e !== "")) {
                throw new Api400Error("Required all fields !");
            }
            const { name, division, city, area, areaType, landmark, phoneNumber, postalCode, } = body;
            let shippingAddressModel = {
                id: "spi_" + Math.floor(Math.random() * 100000000).toString(),
                name,
                division,
                city,
                area,
                areaType,
                landmark,
                phoneNumber,
                postalCode,
                active: false,
            };
            const result = yield BuyerMeta.findOneAndUpdate({ userId: ObjectId(_id) }, { $push: { shippingAddress: shippingAddressModel } }, { upsert: true });
            if (!result)
                throw new Error("Operation failed !");
            NCache.deleteCache(`${_id}_shippingAddress`);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Shipping address added successfully.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function updateShippingAddress(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req.decoded;
            const body = req.body;
            if (!body || typeof body !== "object")
                throw new Api400Error("Required body !");
            if (!Object.values(body).some((e) => e !== null && e !== "")) {
                throw new Api400Error("Required all fields !");
            }
            const { id, name, division, city, area, areaType, landmark, phoneNumber, postalCode, active, } = body;
            if (!id)
                throw new Api400Error("Required address id !");
            let shippingAddressModel = {
                id,
                name,
                division,
                city,
                area,
                areaType,
                landmark,
                phoneNumber,
                postalCode,
                active,
            };
            const result = yield BuyerMeta.findOneAndUpdate({ userId: ObjectId(_id) }, {
                $set: {
                    "shippingAddress.$[i]": shippingAddressModel,
                },
            }, { arrayFilters: [{ "i.id": id }] });
            if (!result)
                throw new Error("Failed to update shipping address.");
            NCache.deleteCache(`${_id}_shippingAddress`);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Shipping address updated.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function selectShippingAddress(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req.decoded;
            let { id, active } = req.body;
            if (!id || typeof id !== "string")
                throw new Api400Error("Required address id !");
            active = active === true ? false : true;
            const result = yield BuyerMeta.findOneAndUpdate({ userId: ObjectId(_id) }, {
                $set: {
                    "shippingAddress.$[j].active": false,
                    "shippingAddress.$[i].active": active,
                },
            }, {
                arrayFilters: [{ "j.id": { $ne: id } }, { "i.id": id }],
                multi: true,
            });
            if (!result)
                throw new Error("Server error !");
            NCache.deleteCache(`${_id}_shippingAddress`);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Default shipping address selected.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function deleteShippingAddress(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req.decoded;
            let id = req.params.id;
            if (!id || typeof id !== "string")
                throw new Api400Error("Required address id !");
            const result = yield BuyerMeta.findOneAndUpdate({ userId: ObjectId(_id) }, { $pull: { shippingAddress: { id } } });
            if (!result)
                throw new Error("Internal issue !");
            NCache.deleteCache(`${_id}_shippingAddress`);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Address deleted successfully.",
                data: {},
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 * @apiController --> Update Profile Data Controller
 * @apiMethod --> PUT
 * @apiRequired --> client email in header
 */
function updateProfileData(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.decoded.email;
            const { userEmail } = req.query;
            const body = req.body;
            if (userEmail !== email) {
                throw new Api400Error("Invalid email address !");
            }
            if (!body || typeof body === "undefined") {
                throw new Api400Error("Required body with request !");
            }
            const { fullName, dob, gender } = body;
            if (!fullName || typeof fullName !== "string")
                throw new Api400Error("Required full name !");
            if (!dob || typeof dob !== "string")
                throw new Api400Error("Required date of birth !");
            if (!gender || typeof gender !== "string")
                throw new Api400Error("Required gender !");
            let profileModel = {
                fullName,
                dob,
                gender,
            };
            const result = yield User.findOneAndUpdate({ email: email }, { $set: profileModel }, { upsert: true });
            if (result) {
                return res
                    .status(200)
                    .send({ success: true, statusCode: 200, message: "Profile updated." });
            }
        }
        catch (error) {
            next(error);
        }
    });
}
function fetchAuthUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const authEmail = req.decoded.email;
            // const ipAddress = req.socket?.remoteAddress;
            let user = yield findUserByEmail(authEmail);
            if (!user || typeof user !== "object")
                throw new Api404Error("User not found !");
            const userDataToken = generateUserDataToken(user);
            if (!userDataToken)
                throw new Error("Internal issue !");
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Welcome " + (user === null || user === void 0 ? void 0 : user.fullName),
                u_data: userDataToken,
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function fetchAddressBook(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req === null || req === void 0 ? void 0 : req.decoded;
            let shippingAddress = [];
            const buyerDataInCache = NCache.getCache(`${_id}_shippingAddress`);
            if (buyerDataInCache) {
                shippingAddress = buyerDataInCache;
            }
            else {
                const buyerMeta = yield BuyerMeta.findOne({ userId: ObjectId(_id) });
                shippingAddress = buyerMeta === null || buyerMeta === void 0 ? void 0 : buyerMeta.shippingAddress;
                NCache.saveCache(`${_id}_shippingAddress`, shippingAddress);
            }
            return res.status(200).json({
                success: true,
                statusCode: 200,
                message: "Data received.",
                data: {
                    shippingAddress,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
module.exports = {
    createShippingAddress,
    updateShippingAddress,
    selectShippingAddress,
    deleteShippingAddress,
    updateProfileData,
    fetchAuthUser,
    fetchAddressBook,
};
