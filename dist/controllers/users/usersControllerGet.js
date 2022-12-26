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
const User = require("../../model/user.model");
const { dbConnection } = require("../../utils/db");
/**
 * controller --> fetch authenticate user information
 * request method --> GET
 * required --> NONE
 */
module.exports.fetchAuthUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        const role = req.decoded.role;
        let result;
        const db = yield dbConnection();
        result = yield User.findOne({ $and: [{ email: authEmail }, { role: role }, { accountStatus: 'active' }] });
        if (!result || typeof result !== "object") {
            return res.status(404).send({ success: false, statusCode: 404, error: "User not found!" });
        }
        result.password = undefined;
        result.authProvider = undefined;
        result.createdAt = undefined;
        return res.status(200).send({ success: true, statusCode: 200, message: 'Welcome ' + (result === null || result === void 0 ? void 0 : result.username), data: result });
    }
    catch (error) {
        next(error);
    }
});
module.exports.manageUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const uType = req.query.uTyp;
        res
            .status(200)
            .send(yield db.collection("users").find({ role: uType }).toArray());
    }
    catch (error) {
        next(error);
    }
});
/**
* controller --> fetch seller request in admin dashboard
* request method --> GET
* required --> NONE
*/
module.exports.checkSellerRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let sellers = yield User.find({ isSeller: 'pending' });
        sellers.forEach((user) => {
            user === null || user === void 0 ? true : delete user.password;
        });
        return res.status(200).send({ success: true, statusCode: 200, data: sellers });
    }
    catch (error) {
        res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
