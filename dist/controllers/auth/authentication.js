"use strict";
// src/controllers/auth/authentication.tsx
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
            throw new apiResponse.Api400Error("User already exists, Please try another phone number or email address !");
        }
        body['_uuid'] = Math.random().toString(36).toUpperCase().slice(2, 18);
        body['verifyToken'] = generateVerifyToken();
        body['idFor'] = 'buy';
        body["buyer"] = {};
        let user = new User(body);
        const result = yield user.save();
        if (!result) {
            throw new apiResponse.Api500Error("Something went wrong !");
        }
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Registration success. Please verify your account.",
            data: { phone: result === null || result === void 0 ? void 0 : result.phone, verifyToken: result === null || result === void 0 ? void 0 : result.verifyToken, email: result === null || result === void 0 ? void 0 : result.email }
        });
    }
    catch (error) {
        next(error);
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
            throw new apiResponse.Api400Error("User already exists, Please try another phone number or email address !");
        }
        body['_uuid'] = Math.random().toString(36).toUpperCase().slice(2, 18);
        body['authProvider'] = 'system';
        body['isSeller'] = 'pending';
        body['idFor'] = 'sell';
        body["seller"] = {};
        let user = new User(body);
        const result = yield user.save();
        if (!result) {
            throw new apiResponse.Api500Error("Something went wrong !");
        }
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
 * @controller --> registration verify by token
 */
module.exports.userVerifyTokenController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const verify_token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]) || undefined;
        const existUser = yield User.findOne({ verifyToken: verify_token });
        if (!existUser) {
            throw new apiResponse.Api404Error("Sorry, User not found !");
        }
        if (existUser.verifyToken && !verify_token) {
            return res.status(200).send({ success: true, statusCode: 200, message: 'Verify token send....', verifyToken: existUser.verifyToken });
        }
        // next condition
        if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {
            if ((existUser === null || existUser === void 0 ? void 0 : existUser.verifyToken) !== verify_token) {
                throw new apiResponse.Api400Error("Invalid verify token !");
            }
            yield User.findOneAndUpdate({ verifyToken: verify_token }, {
                $unset: { verifyToken: 1 },
                $set: { accountStatus: 'active' }
            });
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
    var _b, _c;
    try {
        const { emailOrPhone, password, authProvider } = req.body;
        let token;
        let userDataToken;
        let userData;
        let provider;
        const cookieObject = {
            sameSite: "none",
            secure: true,
            maxAge: 57600000,
            httpOnly: true
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
                { authProvider: provider }
            ]
        });
        /// third party login system like --> Google
        if (authProvider === 'thirdParty') {
            if (!existUser || typeof existUser === 'undefined') {
                const UUID = Math.random().toString(36).toUpperCase().slice(2, 18);
                const user = new User({ _uuid: UUID, email: emailOrPhone, authProvider, accountStatus: 'active' });
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
                throw new apiResponse.Api400Error(`User with ${emailOrPhone} not found!`);
            }
            let comparedPassword = yield comparePassword(password, existUser === null || existUser === void 0 ? void 0 : existUser.password);
            if (!comparedPassword) {
                throw new apiResponse.Api400Error("Password didn't match !");
            }
            if (existUser.verifyToken && (existUser === null || existUser === void 0 ? void 0 : existUser.accountStatus) === "inactive") {
                return res.status(200).send({ success: true, statusCode: 200, message: 'Verify token send....', verifyToken: existUser.verifyToken });
            }
            token = setToken(existUser);
            if ((existUser === null || existUser === void 0 ? void 0 : existUser.role) && (existUser === null || existUser === void 0 ? void 0 : existUser.role) === "BUYER") {
                existUser.buyer["defaultShippingAddress"] = (Array.isArray((_b = existUser === null || existUser === void 0 ? void 0 : existUser.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress) &&
                    ((_c = existUser === null || existUser === void 0 ? void 0 : existUser.buyer) === null || _c === void 0 ? void 0 : _c.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0])) || {};
                existUser.buyer["shoppingCartItems"] = (yield ShoppingCart.countDocuments({ customerEmail: existUser === null || existUser === void 0 ? void 0 : existUser.email })) || 0;
                userDataToken = setUserDataToken({
                    _uuid: existUser === null || existUser === void 0 ? void 0 : existUser._uuid,
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
                    contactEmail: existUser === null || existUser === void 0 ? void 0 : existUser.contactEmail,
                    buyer: existUser === null || existUser === void 0 ? void 0 : existUser.buyer,
                    authProvider: existUser === null || existUser === void 0 ? void 0 : existUser.authProvider
                });
            }
        }
        if (token) {
            // if token then set it to client cookie
            res.cookie("token", token, cookieObject);
            // if all operation success then return the response
            return res.status(200).send({ name: "isLogin", message: "LoginSuccess", uuid: existUser === null || existUser === void 0 ? void 0 : existUser._uuid, u_data: userDataToken });
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
        const token = req.cookies.token; // finding token in http only cookies.
        if (token && typeof token !== "undefined") {
            res.clearCookie("token");
            return res.status(200).send({ success: true, statusCode: 200, message: "Sign out successfully" });
        }
        throw new apiResponse.Api400Error("You already logged out !");
    }
    catch (error) {
        next(error);
    }
});
module.exports.changePasswordController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        let result;
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{5,}$/;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            throw new apiResponse.Api400Error(`Required old password and new password !`);
        }
        else if (newPassword && typeof newPassword !== "string") {
            throw new apiResponse.Api400Error("Password should be string !");
        }
        else if (newPassword.length < 5 || newPassword.length > 8) {
            throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");
        }
        else if (!passwordRegex.test(newPassword)) {
            throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
        }
        else {
            const user = yield User.findOne({ email: authEmail });
            if (!user && typeof user !== "object") {
                throw new apiResponse.Api404Error(`User not found!`);
            }
            const comparedPassword = yield comparePassword(oldPassword, user === null || user === void 0 ? void 0 : user.password);
            if (!comparedPassword) {
                throw new apiResponse.Api400Error("Password didn't match !");
            }
            let hashedPwd = yield bcrypt.hash(newPassword, saltRounds);
            if (hashedPwd) {
                result = yield User.findOneAndUpdate({ email: authEmail }, { $set: { password: hashedPwd } }, { upsert: true });
            }
            if (result)
                return res.status(200).send({ success: true, statusCode: 200, message: "Password updated successfully." });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.checkUserAuthentication = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        if (!body || typeof body === "undefined")
            throw new apiResponse.Api400Error("Required body !");
        const { emailOrPhone } = body;
        const user = yield User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
        if (!user || typeof user === "undefined")
            throw new apiResponse.Api404Error("Sorry user not found with this " + emailOrPhone);
        let securityCode = Math.round(Math.random() * 9999999).toString();
        let lifeTime = 60000;
        res.cookie("securityCode", securityCode, { httpOnly: true, sameSite: "none", secure: true, maxAge: lifeTime });
        return res.status(200).send({ success: true, statusCode: 200, message: "Your Security code is " + securityCode, securityCode, lifeTime, email_phone: emailOrPhone });
    }
    catch (error) {
        next(error);
    }
});
module.exports.checkUserForgotPwdSecurityKey = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const sCode = req.cookies.securityCode;
        if (!sCode)
            throw new apiResponse.Api400Error("Security code is expired !");
        if (!body || typeof body === "undefined")
            throw new apiResponse.Api400Error("Required body !");
        const { emailOrPhone, securityCode } = body;
        const user = yield User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
        if (!user || typeof user === "undefined")
            throw new apiResponse.Api404Error("Sorry user not found with this " + emailOrPhone);
        if (securityCode !== sCode) {
            throw new apiResponse.Api400Error("Invalid security code !");
        }
        res.clearCookie("securityCode");
        let life = 120000;
        res.cookie("set_new_pwd_session", securityCode, { httpOnly: true, sameSite: "none", secure: true, maxAge: life });
        return res.status(200).send({ success: true, statusCode: 200, message: "Success...", data: { email: user === null || user === void 0 ? void 0 : user.email, securityCode, sessionLifeTime: life } });
    }
    catch (error) {
        next(error);
    }
});
module.exports.userSetNewPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let set_new_pwd_session = req.cookies.set_new_pwd_session;
        if (!set_new_pwd_session)
            throw new apiResponse.Api400Error("Sorry ! your session is expired !");
        let result;
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{5,}$/;
        const { email, password, securityCode } = req.body;
        if (securityCode !== set_new_pwd_session)
            throw new apiResponse.Api400Error("Invalid security code !");
        if (!email)
            throw new apiResponse.Api400Error("Required email address !");
        const authEmail = email;
        if (!password) {
            throw new apiResponse.Api400Error(`Required password !`);
        }
        else if (password && typeof password !== "string") {
            throw new apiResponse.Api400Error("Password should be string !");
        }
        else if (password.length < 5 || password.length > 8) {
            throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");
        }
        else if (!passwordRegex.test(password)) {
            throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
        }
        else {
            const user = yield User.findOne({ email: authEmail });
            if (!user && typeof user !== "object") {
                throw new apiResponse.Api404Error(`User not found!`);
            }
            let hashedPwd = yield bcrypt.hash(password, saltRounds);
            if (hashedPwd) {
                result = yield User.findOneAndUpdate({ email: authEmail }, { $set: { password: hashedPwd } }, { upsert: true });
            }
            res.clearCookie('set_new_pwd_session');
            if (result)
                return res.status(200).send({ success: true, statusCode: 200, message: "Password updated successfully." });
        }
    }
    catch (error) {
        next(error);
    }
});
