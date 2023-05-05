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
const apiResponse = require("../../errors/apiResponse");
const { comparePassword } = require("../../utils/compare");
const bcrypt = require("bcrypt");
const email_service = require("../../services/email.service");
const { verify_email_html_template } = require("../../templates/email.template");
const { generateUUID, generateExpireTime, generateSixDigitNumber, generateJwtToken, generateUserDataToken } = require("../../utils/generator");
const { isValidString, isValidEmail, isValidPassword } = require("../../utils/validator");
/**
 * @apiController --> Buyer Registration Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.buyerRegistrationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let body = req.body;
        let existUser = yield User.countDocuments({ $or: [{ phone: body === null || body === void 0 ? void 0 : body.phone }, { email: body === null || body === void 0 ? void 0 : body.email }] });
        if (existUser >= 1)
            throw new apiResponse.Api400Error("User already exists, Please try another phone number or email address !");
        body['_uuid'] = "b" + generateUUID();
        body['verificationCode'] = generateSixDigitNumber();
        body['verificationExpiredAt'] = generateExpireTime();
        body["buyer"] = {};
        body["dob"] = "";
        body["password"] = yield bcrypt.hash(body === null || body === void 0 ? void 0 : body.password, 10);
        body["accountStatus"] = "inactive";
        body["hasPassword"] = true;
        body["contactEmail"] = body === null || body === void 0 ? void 0 : body.email;
        body["idFor"] = "buy";
        body["role"] = "BUYER";
        body["authProvider"] = "system";
        const info = yield email_service({
            to: body === null || body === void 0 ? void 0 : body.email,
            subject: "Verify email address",
            html: verify_email_html_template(body === null || body === void 0 ? void 0 : body.verificationCode)
        });
        if (info === null || info === void 0 ? void 0 : info.response) {
            let user = new User(body);
            user.store = undefined;
            const result = yield user.save();
            return res.status(200).send({
                success: true,
                statusCode: 200,
                returnEmail: body === null || body === void 0 ? void 0 : body.email,
                verificationExpiredAt: result === null || result === void 0 ? void 0 : result.verificationExpiredAt,
                message: `Thanks for your information. Verification code was sent to ${body === null || body === void 0 ? void 0 : body.email}`,
            });
        }
        throw new apiResponse.Api400Error("Sorry registration failed !");
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
        const { email, phone, password, store } = body;
        let existUser = yield User.countDocuments({ $or: [{ email }, { phone }] });
        if (existUser) {
            throw new apiResponse.Api400Error("User already exists, Please try another phone number or email address !");
        }
        if (!isValidPassword)
            throw new apiResponse.Api400Error("Need a strong password !");
        body['_uuid'] = "s" + generateUUID();
        body['authProvider'] = 'system';
        body['idFor'] = 'sell';
        body["role"] = "SELLER";
        body["contactEmail"] = email;
        body['verificationCode'] = generateSixDigitNumber();
        body['verificationExpiredAt'] = generateExpireTime();
        body["accountStatus"] = "inactive";
        body["store"] = store || {};
        body["password"] = yield bcrypt.hash(password, 10);
        body["hasPassword"] = true;
        const info = yield email_service({
            to: email,
            subject: "Verify email address",
            html: verify_email_html_template(body === null || body === void 0 ? void 0 : body.verificationCode)
        });
        if (info === null || info === void 0 ? void 0 : info.response) {
            let user = new User(body);
            user.buyer = undefined;
            const result = yield user.save();
            return res.status(200).send({
                success: true,
                statusCode: 200,
                returnEmail: email,
                verificationExpiredAt: result === null || result === void 0 ? void 0 : result.verificationExpiredAt,
                message: "Thanks for your information. Verification code was sent to " + email + ". Please verify your account.",
            });
        }
        throw new apiResponse.Api500Error("Sorry registration failed !");
    }
    catch (error) {
        next(error);
    }
});
module.exports.generateNewVerificationCode = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.query;
        if (!email)
            throw new apiResponse.Api400Error("Required email address !");
        if (!isValidEmail(email))
            throw new apiResponse.Api400Error("Required valid email address !");
        let user = yield User.findOne({ email });
        if (!user)
            throw new apiResponse.Api400Error("Sorry user not found !");
        if ((user === null || user === void 0 ? void 0 : user.verificationCode) || (user === null || user === void 0 ? void 0 : user.accountStatus) === "inactive") {
            user.verificationCode = generateSixDigitNumber();
            user.verificationExpiredAt = generateExpireTime();
            let updateUser = yield user.save();
            if (updateUser === null || updateUser === void 0 ? void 0 : updateUser.verificationCode) {
                const info = yield email_service({
                    to: user === null || user === void 0 ? void 0 : user.email,
                    subject: "Verify email address",
                    html: verify_email_html_template(updateUser === null || updateUser === void 0 ? void 0 : updateUser.verificationCode)
                });
                if (info === null || info === void 0 ? void 0 : info.response) {
                    return res.status(200).send({
                        success: true,
                        statusCode: 200,
                        returnEmail: updateUser === null || updateUser === void 0 ? void 0 : updateUser.email,
                        verificationExpiredAt: updateUser === null || updateUser === void 0 ? void 0 : updateUser.verificationExpiredAt,
                        message: `Verification code is sent to ${updateUser === null || updateUser === void 0 ? void 0 : updateUser.email}`,
                    });
                }
                throw new apiResponse.Api500Error("Internal error !");
            }
        }
        throw new apiResponse.Api400Error(`Your account with ${email} already active.`);
    }
    catch (error) {
        next(error);
    }
});
/**
 * @controller --> registration verify by token
 */
module.exports.userEmailVerificationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { verificationCode, verificationExpiredAt, email } = req.body;
        if (!verificationCode)
            throw new apiResponse.Api400Error("Required verification code !");
        if (new Date(verificationExpiredAt) < new Date() === true)
            throw new apiResponse.Api400Error("Session expired ! Please resend code ..");
        let user = yield User.findOne({ $and: [{ verificationCode }, { email }] });
        if (!user) {
            throw new apiResponse.Api400Error("Session expired ! Please resend code ..");
        }
        user.verificationCode = undefined;
        user.verificationExpiredAt = undefined;
        user.accountStatus = "active";
        const result = yield user.save();
        return result && res.status(200).send({ success: true, statusCode: 200, message: "Verification successful.", returnEmail: email });
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
    var _a, _b;
    try {
        const { emailOrPhone, password } = req.body;
        if (!isValidString(emailOrPhone))
            throw new apiResponse.Api400Error("Invalid string type !");
        let userDataToken;
        let user = yield User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
        if (!user)
            throw new apiResponse.Api400Error(`User with ${emailOrPhone} not found!`);
        if ((user === null || user === void 0 ? void 0 : user.verificationCode) || (user === null || user === void 0 ? void 0 : user.accountStatus) === "inactive") {
            user.verificationCode = generateSixDigitNumber();
            user.verificationExpiredAt = generateExpireTime();
            let updateUser = yield user.save();
            const info = yield email_service({
                to: user === null || user === void 0 ? void 0 : user.email,
                subject: "Verify email address",
                html: verify_email_html_template(updateUser === null || updateUser === void 0 ? void 0 : updateUser.verificationCode, user === null || user === void 0 ? void 0 : user._uuid)
            });
            if (info === null || info === void 0 ? void 0 : info.response) {
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    returnEmail: updateUser === null || updateUser === void 0 ? void 0 : updateUser.email,
                    verificationExpiredAt: updateUser === null || updateUser === void 0 ? void 0 : updateUser.verificationExpiredAt,
                    message: "Email was sent to " + (updateUser === null || updateUser === void 0 ? void 0 : updateUser.email) + ". Please verify your account.",
                });
            }
            throw new apiResponse.Api500Error("Internal error !");
        }
        let comparedPassword = yield comparePassword(password, user === null || user === void 0 ? void 0 : user.password);
        if (!comparedPassword)
            throw new apiResponse.Api400Error("Password didn't match !");
        let token = generateJwtToken(user);
        if ((user === null || user === void 0 ? void 0 : user.role) && (user === null || user === void 0 ? void 0 : user.role) === "ADMIN") {
            userDataToken = generateUserDataToken({
                _uuid: user === null || user === void 0 ? void 0 : user._uuid,
                fullName: user === null || user === void 0 ? void 0 : user.fullName,
                email: user === null || user === void 0 ? void 0 : user.email,
                phone: user === null || user === void 0 ? void 0 : user.phone,
                phonePrefixCode: user === null || user === void 0 ? void 0 : user.phonePrefixCode,
                hasPassword: user === null || user === void 0 ? void 0 : user.hasPassword,
                role: user === null || user === void 0 ? void 0 : user.role,
                gender: user === null || user === void 0 ? void 0 : user.gender,
                dob: user === null || user === void 0 ? void 0 : user.dob,
                accountStatus: user === null || user === void 0 ? void 0 : user.accountStatus,
                contactEmail: user === null || user === void 0 ? void 0 : user.contactEmail,
                authProvider: user === null || user === void 0 ? void 0 : user.authProvider
            });
        }
        if ((user === null || user === void 0 ? void 0 : user.role) && (user === null || user === void 0 ? void 0 : user.role) === "SELLER") {
            userDataToken = generateUserDataToken({
                _uuid: user === null || user === void 0 ? void 0 : user._uuid,
                fullName: user === null || user === void 0 ? void 0 : user.fullName,
                email: user === null || user === void 0 ? void 0 : user.email,
                phone: user === null || user === void 0 ? void 0 : user.phone,
                phonePrefixCode: user === null || user === void 0 ? void 0 : user.phonePrefixCode,
                hasPassword: user === null || user === void 0 ? void 0 : user.hasPassword,
                role: user === null || user === void 0 ? void 0 : user.role,
                gender: user === null || user === void 0 ? void 0 : user.gender,
                dob: user === null || user === void 0 ? void 0 : user.dob,
                idFor: user === null || user === void 0 ? void 0 : user.idFor,
                accountStatus: user === null || user === void 0 ? void 0 : user.accountStatus,
                contactEmail: user === null || user === void 0 ? void 0 : user.contactEmail,
                store: user === null || user === void 0 ? void 0 : user.store,
                authProvider: user === null || user === void 0 ? void 0 : user.authProvider
            });
        }
        if ((user === null || user === void 0 ? void 0 : user.role) && (user === null || user === void 0 ? void 0 : user.role) === "BUYER") {
            user.buyer["defaultShippingAddress"] = (Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) &&
                ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress.find((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true))) || {};
            userDataToken = generateUserDataToken({
                _uuid: user === null || user === void 0 ? void 0 : user._uuid,
                fullName: user === null || user === void 0 ? void 0 : user.fullName,
                email: user === null || user === void 0 ? void 0 : user.email,
                phone: user === null || user === void 0 ? void 0 : user.phone,
                phonePrefixCode: user === null || user === void 0 ? void 0 : user.phonePrefixCode,
                hasPassword: user === null || user === void 0 ? void 0 : user.hasPassword,
                role: user === null || user === void 0 ? void 0 : user.role,
                gender: user === null || user === void 0 ? void 0 : user.gender,
                dob: user === null || user === void 0 ? void 0 : user.dob,
                idFor: user === null || user === void 0 ? void 0 : user.idFor,
                accountStatus: user === null || user === void 0 ? void 0 : user.accountStatus,
                contactEmail: user === null || user === void 0 ? void 0 : user.contactEmail,
                buyer: user === null || user === void 0 ? void 0 : user.buyer,
                authProvider: user === null || user === void 0 ? void 0 : user.authProvider
            });
        }
        if (token) {
            // if token then set it to client cookie
            res.cookie("token", token, {
                sameSite: "none",
                secure: true,
                maxAge: 57600000,
                httpOnly: true
            });
            // if all operation success then return the response
            return res.status(200).send({ success: true, statusCode: 200, name: "isLogin", message: "LoginSuccess", uuid: user === null || user === void 0 ? void 0 : user._uuid, u_data: userDataToken, token });
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
        const { token } = req.cookies; // finding token in http only cookies.
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
/**
 * @apiController --> Password change controller
 * @apiMethod --> POST
 * @apiRequired --> body {old-password, new-password}
 */
module.exports.changePasswordController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        let result;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword)
            throw new apiResponse.Api400Error(`Required old password and new password !`);
        if (newPassword && typeof newPassword !== "string")
            throw new apiResponse.Api400Error("Password should be string !");
        if (newPassword.length < 5 || newPassword.length > 8)
            throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");
        if (!isValidPassword(newPassword))
            throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
        // find user in user db
        const user = yield User.findOne({ email: authEmail });
        if (!user && typeof user !== "object")
            throw new apiResponse.Api404Error(`User not found!`);
        const comparedPassword = yield comparePassword(oldPassword, user === null || user === void 0 ? void 0 : user.password);
        if (!comparedPassword) {
            throw new apiResponse.Api400Error("Password didn't match !");
        }
        let hashedPwd = yield bcrypt.hash(newPassword, 10);
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
module.exports.checkUserAuthentication = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        if (!body || typeof body === "undefined")
            throw new apiResponse.Api400Error("Required body !");
        const { email } = body;
        const user = yield User.findOne({ email });
        if (!user || typeof user === "undefined")
            throw new apiResponse.Api404Error("Sorry user not found with this " + email);
        let securityCode = generateSixDigitNumber();
        let lifeTime = 300000;
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Reset your WooKart Password',
            html: `<p>Your Security Code is <b>${securityCode}</b> and expire in 5 minutes.</p>`
        };
        const info = yield email_service({
            to: email,
            subject: 'Reset your WooKart Password',
            html: `<p>Your Security Code is <b>${securityCode}</b> and expire in 5 minutes.</p>`
        });
        if (info === null || info === void 0 ? void 0 : info.response) {
            res.cookie("securityCode", securityCode, { httpOnly: true, sameSite: "none", secure: true, maxAge: lifeTime });
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "We have to send security code to your email..",
                lifeTime,
                email
            });
        }
        else {
            throw new apiResponse.Api500Error("Sorry ! Something wrong in your email. please provide valid email address.");
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.checkUserForgotPwdSecurityKey = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sCode = req.cookies.securityCode;
        if (!sCode)
            throw new apiResponse.Api400Error("Security code is expired !");
        if (!req.body || typeof req.body === "undefined")
            throw new apiResponse.Api400Error("Required body !");
        const { email, securityCode } = req.body;
        if (!email)
            throw new apiResponse.Api400Error("Required email !");
        if (!securityCode)
            throw new apiResponse.Api400Error("Required security code !");
        const user = yield User.findOne({ email });
        if (!user || typeof user === "undefined")
            throw new apiResponse.Api404Error("Sorry user not found with this " + email);
        if (securityCode !== sCode)
            throw new apiResponse.Api400Error("Invalid security code !");
        res.clearCookie("securityCode");
        let life = 120000;
        res.cookie("set_new_pwd_session", securityCode, { httpOnly: true, sameSite: "none", secure: true, maxAge: life });
        return res.status(200).send({ success: true, statusCode: 200, message: "Success. Please set a new password.", data: { email: user === null || user === void 0 ? void 0 : user.email, securityCode, sessionLifeTime: life } });
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
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{5,}$/;
        const { email, password, securityCode } = req.body;
        if (securityCode !== set_new_pwd_session)
            throw new apiResponse.Api400Error("Invalid security code !");
        if (!email)
            throw new apiResponse.Api400Error("Required email address !");
        if (!password)
            throw new apiResponse.Api400Error(`Required password !`);
        if (password && typeof password !== "string")
            throw new apiResponse.Api400Error("Password should be string !");
        if (password.length < 5 || password.length > 8)
            throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");
        if (!passwordRegex.test(password))
            throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
        const user = yield User.findOne({ email });
        if (!user && typeof user !== "object") {
            throw new apiResponse.Api404Error(`User not found!`);
        }
        let hashedPwd = yield bcrypt.hash(password, 10);
        let result = hashedPwd ? yield User.findOneAndUpdate({ email }, { $set: { password: hashedPwd } }, { upsert: true }) : false;
        res.clearCookie('set_new_pwd_session');
        if (!result)
            throw new apiResponse.Api500Error("Something wrong in server !");
        return result && res.status(200).send({ success: true, statusCode: 200, message: "Password updated successfully." });
    }
    catch (error) {
        next(error);
    }
});
