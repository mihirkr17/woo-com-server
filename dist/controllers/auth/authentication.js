"use strict";
// authentication.tsx
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
const generateVerifyToken = require("../../utils/generateVerifyToken");
const apiResponse = require("../../errors/apiResponse");
const setToken = require("../../utils/setToken");
const comparePassword = require("../../utils/comparePassword");
const setUserDataToken = require("../../utils/setUserDataToken");
const ShoppingCart = require("../../model/shoppingCart.model");
const bcrypt = require("bcrypt");
const saltRounds = 10;
/**
 * @apiController --> Buyer Registration Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.buyerRegistrationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let body = req.body;
        let existUser = yield User.findOne({ $or: [{ phone: body === null || body === void 0 ? void 0 : body.phone }, { email: body.email }] });
        if (existUser) {
            throw new apiResponse.Api400Error("AuthError", "User already exists, Please try another phone number or email address !");
        }
        body['_UUID'] = Math.random().toString(36).toUpperCase().slice(2, 18);
        body['verifyToken'] = generateVerifyToken();
        body['idFor'] = 'buy';
        let user = new User(body);
        const result = yield user.save();
        if (!result) {
            throw new apiResponse.Api500Error("ServerError", "Something went wrong !");
        }
        res.cookie("verifyToken", result === null || result === void 0 ? void 0 : result.verifyToken, { maxAge: 3600000, httpOnly: false });
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Registration success. Please verify your account.",
            data: { phone: result === null || result === void 0 ? void 0 : result.phone, verifyToken: result === null || result === void 0 ? void 0 : result.verifyToken, email: result === null || result === void 0 ? void 0 : result.email }
        });
    }
    catch (error) {
        return next(error);
    }
});
/**
 * @apiController --> Seller Registration Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.sellerRegistrationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let body = req.body;
        let existUser = yield User.findOne({ $or: [{ email: body.email }, { phone: body.phone }] });
        if (existUser) {
            throw new apiResponse.Api400Error("RegistrationError", "User already exists, Please try another phone number or email address !");
        }
        body['_UUID'] = Math.random().toString(36).toUpperCase().slice(2, 18);
        body['authProvider'] = 'system';
        body['isSeller'] = 'pending';
        body['idFor'] = 'sell';
        let user = new User(body);
        const result = yield user.save();
        if (!result) {
            throw new apiResponse.Api500Error("ServerError", "Something went wrong !");
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
        next(error);
    }
});
/**
 * @controller --> registration verify
 */
module.exports.userVerifyTokenController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const verify_token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]) || undefined;
        const existUser = yield User.findOne({ verifyToken: verify_token });
        if (!existUser) {
            throw new apiResponse.Api400Error("VerifyTokenError", "Sorry, User not found !");
        }
        if (existUser.verifyToken && !verify_token) {
            res.cookie("verifyToken", existUser.verifyToken, { maxAge: 3600000, httpOnly: false });
            return res.send({ success: true, statusCode: 200, message: 'verifyTokenOnCookie' });
        }
        // next condition
        if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {
            if ((existUser === null || existUser === void 0 ? void 0 : existUser.verifyToken) !== verify_token) {
                throw new apiResponse.Api400Error("AuthError", "Invalid verify token !");
            }
            yield User.findOneAndUpdate({ verifyToken: verify_token }, {
                $unset: { verifyToken: 1 },
                $set: { accountStatus: 'active' }
            });
            res.clearCookie('verifyToken');
            return res.status(200).send({ success: true, statusCode: 200, message: "User verified.", data: { email: existUser === null || existUser === void 0 ? void 0 : existUser.email } });
        }
    }
    catch (error) {
        next(error);
    }
});
/**
 * @apiController --> All User Login Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.loginController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d;
    try {
        const verify_token = ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1]) || undefined;
        const { emailOrPhone, password, authProvider } = req.body;
        let token;
        let userDataToken;
        let userData;
        let provider;
        const cookieObject = {
            sameSite: "none",
            secure: true,
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
                { $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
                { authProvider: provider },
                { accountStatus: 'active' }
            ]
        });
        /// third party login system like --> Google
        if (authProvider === 'thirdParty') {
            if (!existUser || typeof existUser === 'undefined') {
                const UUID = Math.random().toString(36).toUpperCase().slice(2, 18);
                const user = new User({ _UUID: UUID, email: emailOrPhone, authProvider, accountStatus: 'active' });
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
                throw new apiResponse.Api400Error("LoginError", `User with ${emailOrPhone} not found!`);
            }
            let comparedPassword = yield comparePassword(password, existUser === null || existUser === void 0 ? void 0 : existUser.password);
            if (!comparedPassword) {
                throw new apiResponse.Api400Error("LoginError", "Password didn't match !");
            }
            if (existUser.verifyToken && !verify_token) {
                res.cookie("verifyToken", existUser.verifyToken, { maxAge: 3600000, httpOnly: false });
                return res.send({ success: true, statusCode: 200, message: 'verifyTokenOnCookie' });
            }
            // next condition
            if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {
                if ((existUser === null || existUser === void 0 ? void 0 : existUser.verifyToken) !== verify_token) {
                    throw new apiResponse.Api400Error("TokenError", 'Required valid token !');
                }
                yield User.updateOne({ email: emailOrPhone }, { $unset: { verifyToken: 1 }, $set: { accountStatus: 'active' } });
                res.clearCookie('verifyToken');
            }
            token = setToken(existUser);
            if ((existUser === null || existUser === void 0 ? void 0 : existUser.role) && (existUser === null || existUser === void 0 ? void 0 : existUser.role) === "BUYER") {
                existUser.buyer["defaultShippingAddress"] = (Array.isArray((_c = existUser === null || existUser === void 0 ? void 0 : existUser.buyer) === null || _c === void 0 ? void 0 : _c.shippingAddress) &&
                    ((_d = existUser === null || existUser === void 0 ? void 0 : existUser.buyer) === null || _d === void 0 ? void 0 : _d.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
                existUser.buyer["shoppingCartItems"] = (yield ShoppingCart.countDocuments({ customerEmail: existUser === null || existUser === void 0 ? void 0 : existUser.email })) || 0;
                let user = {
                    _UUID: existUser === null || existUser === void 0 ? void 0 : existUser._UUID,
                    fullName: existUser === null || existUser === void 0 ? void 0 : existUser.fullName,
                    email: existUser === null || existUser === void 0 ? void 0 : existUser.email,
                    phone: existUser === null || existUser === void 0 ? void 0 : existUser.phone,
                    phonePrefixCode: existUser === null || existUser === void 0 ? void 0 : existUser.phonePrefixCode,
                    hasPassword: existUser === null || existUser === void 0 ? void 0 : existUser.hasPassword,
                    role: existUser === null || existUser === void 0 ? void 0 : existUser.role,
                    gender: existUser === null || existUser === void 0 ? void 0 : existUser.gender,
                    dob: existUser === null || existUser === void 0 ? void 0 : existUser.dob,
                    idFor: existUser === null || existUser === void 0 ? void 0 : existUser.idFor,
                    accountStatus: existUser === null || existUser === void 0 ? void 0 : existUser.accountStatus,
                    authProvider: existUser === null || existUser === void 0 ? void 0 : existUser.authProvider,
                    contactEmail: existUser === null || existUser === void 0 ? void 0 : existUser.contactEmail,
                    buyer: existUser === null || existUser === void 0 ? void 0 : existUser.buyer
                };
                userDataToken = setUserDataToken(user);
            }
        }
        if (token) {
            res.cookie("token", token, cookieObject);
            res.cookie("u_data", userDataToken, { httpOnly: false, maxAge: 57600000, sameSite: "none" });
            // if all success then return the response
            return res.status(200).send({ name: "isLogin", message: "LoginSuccess", uuid: existUser === null || existUser === void 0 ? void 0 : existUser._UUID, u_data: userDataToken });
        }
    }
    catch (error) {
        return next(error);
    }
});
/**
 * @apiController --> Sign Out Users Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.signOutController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("token");
        res.status(200).send({ success: true, statusCode: 200, message: "Sign out successfully" });
    }
    catch (error) {
        next(error);
    }
});
module.exports.changePasswordController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        let result;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            throw new apiResponse.Api400Error("ClientError", `Required old password and new password !`);
        }
        const user = yield User.findOne({ email: authEmail });
        if (!user && typeof user !== "object") {
            throw new apiResponse.Api404Error("ClientError", `User not found!`);
        }
        const comparedPassword = yield comparePassword(oldPassword, user === null || user === void 0 ? void 0 : user.password);
        if (!comparedPassword) {
            throw new apiResponse.Api400Error("ClientError", "Password didn't match !");
        }
        let hashedPwd = yield bcrypt.hash(newPassword, saltRounds);
        if (hashedPwd) {
            result = yield User.findOneAndUpdate({ email: authEmail }, { $set: { password: hashedPwd } }, { upsert: true });
        }
        if (result)
            return res.status(200).send({ success: true, statusCode: 200, message: "Password updated successfully." });
    }
    catch (error) {
        next(error);
    }
});
