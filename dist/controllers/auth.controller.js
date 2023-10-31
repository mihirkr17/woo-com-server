"use strict";
// src/controllers/auth.controller.ts
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
const { MyStore, Buyer } = require("../model/usersmeta.model");
const { Api400Error, Api500Error, Api404Error, } = require("../errors/apiResponse");
const bcrypt = require("bcrypt");
const smtpSender = require("../services/email.service");
const { verify_email_html_template, send_six_digit_otp_template, } = require("../templates/email.template");
const { generateExpireTime, generateSixDigitNumber, generateJwtToken, generateUserDataToken, generateVerificationToken, } = require("../utils/generator");
const { validEmail, validPassword } = require("../utils/validator");
const { countUserByEmail, findUserByEmail, } = require("../services/userService");
// buyers controllers
/**
 * [async description]
 *
 * @param   {Request}       req   [req description]
 * @param   {Response}      res   [res description]
 * @param   {NextFunction}  next  [next description]
 *
 * @return  {[type]}              [return description]
 */
function loginSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email: inputEmail, password: inputPassword } = req.body;
            let user = yield User.findOne({ email: inputEmail }); //findUserByEmail(inputEmail);
            if (!user)
                throw new Api400Error(`User with ${inputEmail} not found!`);
            const { email, verified, accountStatus, fullName, devices } = user || {};
            const matchedPwd = yield user.comparePassword(inputPassword);
            if (!matchedPwd)
                throw new Api400Error("Password didn't matched !");
            if (!verified || accountStatus === "Inactive") {
                const verifyToken = generateVerificationToken({ email });
                const info = yield smtpSender({
                    to: email,
                    subject: "Verify email address",
                    html: verify_email_html_template(verifyToken, fullName, req === null || req === void 0 ? void 0 : req.appUri),
                });
                if (!(info === null || info === void 0 ? void 0 : info.response))
                    throw new Error("Internal error !");
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    data: {
                        returnEmail: email,
                        action: "ACCOUNT_VERIFY_REQUEST",
                    },
                    message: `Go to ${email} and confirm email for verification.`,
                });
            }
            const loginToken = generateJwtToken(user);
            const userDataToken = generateUserDataToken(user);
            if (!loginToken || !userDataToken)
                throw new Error("Login failed due to internal issue !");
            const newDevice = {
                userAgent: req.get("user-agent"),
                ipAddress: req.ip,
            };
            let filterDevice = (devices &&
                devices.filter((item) => (item === null || item === void 0 ? void 0 : item.ipAddress) !== (newDevice === null || newDevice === void 0 ? void 0 : newDevice.ipAddress))) ||
                [];
            user.devices = [...filterDevice, newDevice];
            yield user.save();
            // if all operation success then return the response
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Login success",
                data: {
                    action: "LOGIN",
                    u_data: userDataToken,
                    token: loginToken,
                    role: user === null || user === void 0 ? void 0 : user.role,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 * [async description]
 *
 * @return  {[type]}  [return description]
 */
function registrationSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let body = req.body;
            const requiredRoles = ["buyer", "supplier", "admin"];
            const { role } = req.query;
            if (!role)
                throw new Api400Error("Required role query in url !");
            if (!requiredRoles.includes(role))
                throw new Api400Error("Invalid role type in query !");
            let existUser = yield countUserByEmail(body === null || body === void 0 ? void 0 : body.email);
            if (existUser >= 1)
                throw new Api400Error("User already exists, Please try another email address !");
            const verifyToken = generateVerificationToken({ email: body === null || body === void 0 ? void 0 : body.email });
            const emailResult = yield smtpSender({
                to: body === null || body === void 0 ? void 0 : body.email,
                subject: "Verify email address",
                html: verify_email_html_template(verifyToken, body === null || body === void 0 ? void 0 : body.fullName),
            });
            if (!(emailResult === null || emailResult === void 0 ? void 0 : emailResult.response))
                throw new Api400Error("Verification code not send to your email !");
            if (role === "buyer") {
                body["role"] = "BUYER";
            }
            if (role === "supplier") {
                body["role"] = "SUPPLIER";
            }
            if (role === "admin") {
                body["role"] = "ADMIN";
            }
            yield User.insertOne(body);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: `Thanks for your information. Verification code send to ${body === null || body === void 0 ? void 0 : body.email}`,
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
function accountVerifyByEmailSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req.decoded;
            let user = yield User.findOne({ email });
            if (!user)
                throw new Api400Error(`Sorry account with ${email} not found`);
            if (user.verified && user.accountStatus === "Active") {
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "Your account already verified.",
                    data: {},
                });
            }
            user.verified = true;
            user.accountStatus = "Active";
            yield user.save();
            return res.redirect(301, `http://localhost:3000/login?email=${email}`);
            //  return res.status(200).send({
            //    success: true,
            //    statusCode: 200,
            //    message: `Congrats! Account with ${email} verification complete.`,
            //    data: {
            //      returnEmail: email,
            //    },
            //  });
        }
        catch (error) {
            next(error);
        }
    });
}
function sendOtpForForgotPwdChangeSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req.body;
            if (!email)
                throw new Api400Error("Required email from body !");
            const user = yield User.findOne({ email });
            if (!user)
                throw new Api404Error(`User with ${email} Not found`);
            const otp = generateSixDigitNumber();
            const info = yield smtpSender({
                to: email,
                subject: "Reset your WooKart Password",
                html: send_six_digit_otp_template(otp, user === null || user === void 0 ? void 0 : user.fullName),
            });
            if (!(info === null || info === void 0 ? void 0 : info.response))
                throw new Error("Sorry ! Something wrong in your email. please provide valid email address.");
            const otpExTime = new Date(Date.now() + 5 * 60 * 1000); // 5mins added with current time
            user.otp = otp;
            user.otpExTime = otpExTime;
            yield user.save();
            return res.status(200).json({
                success: true,
                statusCode: 200,
                message: "We have send otp to your email.",
                data: {
                    otpExTime: otpExTime.getTime(),
                    returnEmail: user === null || user === void 0 ? void 0 : user.email,
                },
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
function passwordChangeSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req.decoded;
            const { oldPassword, newPassword } = req.body;
            if (!oldPassword || !newPassword)
                throw new Api400Error(`Required old password and new password !`);
            if (newPassword && typeof newPassword !== "string")
                throw new Api400Error("Password should be string !");
            if (newPassword.length < 5 || newPassword.length > 8)
                throw new Api400Error("Password length should be 5 to 8 characters !");
            if (!validPassword(newPassword))
                throw new Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
            // find user in db by email
            let user = yield User.findOne({ email: email });
            if (!user && typeof user !== "object")
                throw new Api404Error(`User not found !`);
            const comparedPassword = yield bcrypt.compare(oldPassword, user === null || user === void 0 ? void 0 : user.password);
            if (!comparedPassword) {
                throw new Api400Error("Password didn't match !");
            }
            let hashedPwd = yield bcrypt.hash(newPassword, 10);
            if (!hashedPwd)
                throw new Api500Error("Internal errors !");
            user.password = hashedPwd;
            const result = yield user.save();
            return (result &&
                res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "Password updated successfully.",
                }));
        }
        catch (error) {
            next(error);
        }
    });
}
function checkOtpForForgotPwdChangeSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { otp, email } = req === null || req === void 0 ? void 0 : req.body;
            if (!otp)
                throw new Api400Error("Required otp in body !");
            if (otp.length <= 5 || (otp === null || otp === void 0 ? void 0 : otp.length) >= 7)
                throw new Api400Error("Otp must 6 digit!");
            if (!email)
                throw new Api400Error("Required email address in body !");
            const user = yield User.findOne({ email });
            if (!user)
                throw new Api404Error(`Sorry we can't find any user with this ${email}!`);
            if (!user.otp)
                throw new Error("Internal error !");
            if (user.otp !== otp)
                throw new Api400Error("Invalid otp !");
            const now = new Date().getTime();
            const otpExTime = new Date(otp === null || otp === void 0 ? void 0 : otp.otpExTime).getTime();
            if (now >= otpExTime) {
                throw new Api400Error("Otp expired !");
            }
            return res.status(200).json({
                success: true,
                statusCode: 200,
                message: "Redirecting...",
                data: {
                    redirectUri: `forgot-pwd?action=forgotpwdform`,
                },
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
function setNewPwdForForgotPwdChangeSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            if (!email || !validEmail(email))
                throw new Api400Error("Required valid email address !");
            if (password.length < 5 || password.length > 8)
                throw new Api400Error("Password length should be 5 to 8 characters !");
            if (!validPassword(password) || typeof password !== "string")
                throw new Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
            const user = yield User.findOne({ email });
            if (!user && typeof user !== "object")
                throw new Api404Error(`User not found!`);
            //  const hashedPwd = await bcrypt.hash(password, 10);
            user.password = password;
            user.otp = undefined;
            user.otpExTime = undefined;
            yield user.save();
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Password updated successfully.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
module.exports = {
    loginSystem,
    registrationSystem,
    accountVerifyByEmailSystem,
    passwordChangeSystem,
    sendOtpForForgotPwdChangeSystem,
    checkOtpForForgotPwdChangeSystem,
    setNewPwdForForgotPwdChangeSystem,
};
