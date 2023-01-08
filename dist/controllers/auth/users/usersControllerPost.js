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
const setToken = require("../../../utils/setToken");
const User = require("../../../model/user.model");
const { comparePassword } = require("../../../utils/comparePassword");
const generateVerifyToken = require("../../../utils/generateVerifyToken");
/**
 * controller --> user login controller
 * request method --> POST
 * required --> BODY
 */
module.exports.userLoginController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const verify_token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]) || undefined;
        const { email, password, authProvider } = req.body;
        let token;
        let userData;
        let provider;
        const cookieObject = {
            // sameSite: "none",
            // secure: true,
            maxAge: 57600000,
            httpOnly: true,
        };
        if (typeof authProvider === 'undefined' || !authProvider) {
            provider = 'system';
        }
        else {
            provider = authProvider;
        }
        const existUser = yield User.findOne({
            $and: [
                { email },
                { authProvider: provider },
                { accountStatus: 'active' }
            ]
        });
        /// third party login system like --> Google
        if (authProvider === 'thirdParty') {
            if (!existUser || typeof existUser === 'undefined') {
                const UUID = Math.random().toString(36).toUpperCase().slice(2, 18);
                const user = new User({ _UUID: UUID, email, authProvider, accountStatus: 'active' });
                userData = yield user.save();
            }
            else {
                userData = existUser;
            }
            token = setToken(userData);
        }
        // system login
        else {
            if (!existUser) {
                return res.status(400).send({ success: false, statusCode: 400, error: 'User not found !!!' });
            }
            let comparedPassword = yield comparePassword(password, existUser === null || existUser === void 0 ? void 0 : existUser.password);
            if (!comparedPassword) {
                return res.status(400).send({ success: false, statusCode: 400, error: "Password didn't match !!!" });
            }
            if (existUser.verifyToken && !verify_token) {
                res.cookie("verifyToken", existUser.verifyToken, { maxAge: 3600000, httpOnly: false });
                return res.send({ success: true, statusCode: 200, message: 'verifyTokenOnCookie' });
            }
            // next condition
            if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {
                if ((existUser === null || existUser === void 0 ? void 0 : existUser.verifyToken) !== verify_token) {
                    return res.status(400).send({ success: false, statusCode: 400, error: 'Required valid token !!!' });
                }
                yield User.updateOne({ email }, { $unset: { verifyToken: 1 }, $set: { accountStatus: 'active' } });
                res.clearCookie('verifyToken');
            }
            token = setToken(existUser);
        }
        if (token) {
            res.cookie("token", token, cookieObject);
            res.cookie("is_logged", existUser === null || existUser === void 0 ? void 0 : existUser._id, { httpOnly: false, maxAge: 57600000 });
            return res.status(200).send({ message: "isLogin", statusCode: 200, success: true });
        }
    }
    catch (error) {
        return res.status(400).send({ success: false, statusCode: 400, error: error.message });
    }
});
/**
 * controller --> user registration controller
 * request method --> POST
 * required --> BODY
 */
module.exports.userRegisterController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let body = req.body;
        let existUser = yield User.findOne({ $or: [{ phone: body === null || body === void 0 ? void 0 : body.phone }, { email: body.email }] });
        if (existUser) {
            return res.status(400).send({ success: false, statusCode: 400, error: "User already exists ! Please try another username or email address." });
        }
        body['_UUID'] = Math.random().toString(36).toUpperCase().slice(2, 18);
        body['verifyToken'] = generateVerifyToken();
        body['idFor'] = 'buy';
        let user = new User(body);
        const result = yield user.save();
        if (!result) {
            return res.status(500).send({ success: false, statusCode: 500, error: "Internal error!" });
        }
        res.cookie("verifyToken", result === null || result === void 0 ? void 0 : result.verifyToken, { maxAge: 3600000, httpOnly: false });
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Registration success. Please verify your account.",
            data: { username: result === null || result === void 0 ? void 0 : result.username, verifyToken: result === null || result === void 0 ? void 0 : result.verifyToken, email: result === null || result === void 0 ? void 0 : result.email }
        });
    }
    catch (error) {
        return res.status(500).send({ success: false, statusCode: 500, error: error.message });
    }
});
/**
 * @controller --> registration verify
 */
module.exports.userRegisterVerify = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const verify_token = ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1]) || undefined;
        const existUser = yield User.findOne({ verifyToken: verify_token });
        if (!existUser) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'User not found !!!' });
        }
        if (existUser.verifyToken && !verify_token) {
            res.cookie("verifyToken", existUser.verifyToken, { maxAge: 3600000, httpOnly: false });
            return res.send({ success: true, statusCode: 200, message: 'verifyTokenOnCookie' });
        }
        // next condition
        if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {
            if ((existUser === null || existUser === void 0 ? void 0 : existUser.verifyToken) !== verify_token) {
                return res.status(400).send({ success: false, statusCode: 400, error: 'Invalid token !!!' });
            }
            yield User.updateOne({ verifyToken: verify_token }, {
                $unset: { verifyToken: 1 },
                $set: { accountStatus: 'active' }
            });
            res.clearCookie('verifyToken');
            return res.status(200).send({ success: true, statusCode: 200, message: "User verified.", data: { username: existUser === null || existUser === void 0 ? void 0 : existUser.username } });
        }
    }
    catch (error) {
    }
});
module.exports.signOutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("token");
        res.clearCookie('is_logged');
        res.status(200).send({ success: true, statusCode: 200, message: "Sign out successfully" });
    }
    catch (error) {
        res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.sellerRegisterController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let body = req.body;
        let existUser = yield User.findOne({ email: body.email });
        if (existUser) {
            return res.status(400).send({ success: false, statusCode: 400, error: "User already exists ! Please try another username or email address." });
        }
        body['_UUID'] = Math.random().toString(36).toUpperCase().slice(2, 18);
        body['authProvider'] = 'system';
        body['isSeller'] = 'pending';
        body['idFor'] = 'sell';
        let user = new User(body);
        const result = yield user.save();
        if (!result) {
            return res.status(500).send({ success: false, statusCode: 500, error: "Internal error!" });
        }
        res.cookie("verifyToken", result === null || result === void 0 ? void 0 : result.verifyToken, { maxAge: 3600000, httpOnly: false });
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Registration success. Please verify your account.",
            data: { username: result === null || result === void 0 ? void 0 : result.username, verifyToken: result === null || result === void 0 ? void 0 : result.verifyToken, email: result === null || result === void 0 ? void 0 : result.email }
        });
    }
    catch (error) {
        return res.status(500).send({ success: false, statusCode: 500, error: error.message });
    }
});
