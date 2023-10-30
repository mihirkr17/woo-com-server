"use strict";
// src/controllers/buyer.auth.controller.ts
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
const { Api400Error, Api500Error, Api404Error, } = require("../errors/apiResponse");
const bcrypt = require("bcrypt");
const smtpSender = require("../services/email.service");
const { verify_email_html_template } = require("../templates/email.template");
const { generateExpireTime, generateSixDigitNumber, generateJwtToken, generateUserDataToken, generateVerificationToken, } = require("../utils/generator");
const { validEmail, validPassword } = require("../utils/validator");
const { countUserByEmail, findUserByEmail, } = require("../services/userService");
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function userRegistrationController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let body = req.body;
            let existUser = yield countUserByEmail(body === null || body === void 0 ? void 0 : body.email);
            if (existUser >= 1)
                throw new Api400Error("User already exists, Please try another email address !");
            body["authProvider"] = "system";
            const verifyToken = generateVerificationToken(body);
            const emailResult = yield smtpSender({
                to: body === null || body === void 0 ? void 0 : body.email,
                subject: "Verify email address",
                html: verify_email_html_template(verifyToken),
            });
            if (!(emailResult === null || emailResult === void 0 ? void 0 : emailResult.response))
                throw new Api400Error("Verification code not send to your email !");
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: `Thanks for your information. Verification code send to this ${body === null || body === void 0 ? void 0 : body.email}`,
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
function userLoginController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email: inputEmail, password: inputPassword } = req.body;
            let user = yield User.findOne({ email: inputEmail }); //findUserByEmail(inputEmail);
            if (!user)
                throw new Api400Error(`User with ${inputEmail} not found!`);
            const { email, verified, accountStatus, fullName } = user || {};
            const matchedPwd = yield user.comparePassword(inputPassword);
            if (!matchedPwd)
                throw new Api400Error("Password didn't matched !");
            console.log(user);
            if (!verified || accountStatus === "Inactive") {
                const verifyToken = generateVerificationToken({ email });
                const info = yield smtpSender({
                    to: email,
                    subject: "Verify email address",
                    html: verify_email_html_template(verifyToken, fullName),
                });
                if (!(info === null || info === void 0 ? void 0 : info.response))
                    throw new Error("Internal error !");
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    returnEmail: email,
                    message: `Verification code was sent to ${email}. Please verify your account.`,
                });
            }
            const loginToken = generateJwtToken(user);
            const userDataToken = generateUserDataToken(user);
            if (!loginToken || !userDataToken)
                throw new Error("Login failed due to internal issue !");
            // if all operation success then return the response
            return res.status(200).send({
                success: true,
                statusCode: 200,
                name: "Login",
                message: "Login success",
                uuid: user === null || user === void 0 ? void 0 : user._uuid,
                u_data: userDataToken,
                token: loginToken,
                role: user === null || user === void 0 ? void 0 : user.role,
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
function userAccountVerifyByEmail(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req.decoded;
            let user = yield findUserByEmail(email);
            if (!user)
                throw new Api400Error(`Sorry account with ${email} not found`);
            if (user.verified && user.accountStatus === "Active")
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "Congratulation your account already verified",
                });
            user.verified = true;
            user.accountStatus = "Active";
            yield user.save();
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: `Congrats! Account with ${email} verification complete.`,
                returnEmail: email,
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
function generateNewVerifyToken(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req.query;
            if (!email)
                throw new Api400Error("Required email address !");
            if (!validEmail(email))
                throw new Api400Error("Required valid email address !");
            let user = yield findUserByEmail({ email });
            if (!user)
                throw new Api400Error("Sorry user not found !");
            if ((user === null || user === void 0 ? void 0 : user.verificationCode) || (user === null || user === void 0 ? void 0 : user.accountStatus) === "Inactive") {
                user.verificationCode = generateSixDigitNumber();
                user.verificationExpiredAt = generateExpireTime();
                let updateUser = yield user.save();
                if (updateUser === null || updateUser === void 0 ? void 0 : updateUser.verificationCode) {
                    const info = yield smtpSender({
                        to: user === null || user === void 0 ? void 0 : user.email,
                        subject: "Verify email address",
                        html: verify_email_html_template(updateUser === null || updateUser === void 0 ? void 0 : updateUser.verificationCode),
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
                    throw new Api500Error("Internal error !");
                }
            }
            throw new Api400Error(`Your account with ${email} already active.`);
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 * @controller --> registration verify by token
 */
function userEmailVerificationController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { verificationCode, verificationExpiredAt, email } = req.body;
            if (!verificationCode)
                throw new Api400Error("Required verification code !");
            if (verificationCode.length >= 7 || verificationCode <= 5)
                throw new Api400Error("Verification code should be 6 digits !");
            if (new Date(verificationExpiredAt) < new Date() === true)
                throw new Api400Error("Session expired ! Please resend code ..");
            let user = yield User.findOne({ $and: [{ verificationCode }, { email }] });
            if (!user)
                throw new Api400Error("Session expired !");
            user.verificationCode = undefined;
            user.verificationExpiredAt = undefined;
            user.accountStatus = "Active";
            const result = yield user.save();
            return (result &&
                res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "Verification successful.",
                    returnEmail: email,
                }));
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
function changePasswordController(req, res, next) {
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
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function checkUserAuthenticationByEmail(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req === null || req === void 0 ? void 0 : req.body;
            if (!email || !validEmail(email))
                throw new Api400Error("Required valid email address !");
            const user = yield User.findOne({ email });
            if (!user || typeof user === "undefined")
                throw new Api404Error(`Sorry user not found with this ${email}`);
            const securityCode = generateSixDigitNumber();
            const lifeTime = 300000;
            const info = yield smtpSender({
                to: email,
                subject: "Reset your WooKart Password",
                html: `<p>Your Security Code is <b style="font-size: 1.5rem">${securityCode}</b> and expire in 5 minutes.</p>`,
            });
            if (!(info === null || info === void 0 ? void 0 : info.response))
                throw new Api500Error("Sorry ! Something wrong in your email. please provide valid email address.");
            res.cookie("securityCode", securityCode, {
                httpOnly: true,
                sameSite: "none",
                secure: true,
                maxAge: lifeTime,
            });
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "We have send otp to your email..",
                lifeTime,
                email,
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
function checkUserForgotPwdSecurityKey(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sCode = req.cookies.securityCode;
            if (!sCode)
                throw new Api400Error("Security code is expired !");
            if (!req.body || typeof req.body === "undefined")
                throw new Api400Error("Required body !");
            const { email, securityCode } = req.body;
            if (!email)
                throw new Api400Error("Required email !");
            if (!securityCode)
                throw new Api400Error("Required security code !");
            const user = yield User.findOne({ email });
            if (!user || typeof user === "undefined")
                throw new Api404Error("Sorry user not found with this " + email);
            if (securityCode !== sCode)
                throw new Api400Error("Invalid security code !");
            res.clearCookie("securityCode");
            const life = 120000;
            res.cookie("set_new_pwd_session", securityCode, {
                httpOnly: true,
                sameSite: "none",
                secure: true,
                maxAge: life,
            });
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Success. Please set a new password.",
                data: { email: user === null || user === void 0 ? void 0 : user.email, securityCode, sessionLifeTime: life },
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
function userSetNewPassword(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { set_new_pwd_session } = req.cookies;
            if (!set_new_pwd_session)
                throw new Api400Error("Sorry ! your session is expired !");
            const { email, password, securityCode } = req.body;
            if (securityCode !== set_new_pwd_session)
                throw new Api400Error("Invalid security code !");
            if (!email || !validEmail(email))
                throw new Api400Error("Required valid email address !");
            if (password.length < 5 || password.length > 8)
                throw new Api400Error("Password length should be 5 to 8 characters !");
            if (!validPassword(password) || typeof password !== "string")
                throw new Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
            const user = yield User.findOne({ email });
            if (!user && typeof user !== "object")
                throw new Api404Error(`User not found!`);
            const hashedPwd = yield bcrypt.hash(password, 10);
            const result = hashedPwd
                ? yield User.findOneAndUpdate({ email }, { $set: { password: hashedPwd } }, { upsert: true })
                : false;
            res.clearCookie("set_new_pwd_session");
            if (!result)
                throw new Api500Error("Something wrong in server !");
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
    userRegistrationController,
    userLoginController,
    userAccountVerifyByEmail,
    generateNewVerifyToken,
    userEmailVerificationController,
    changePasswordController,
    checkUserAuthenticationByEmail,
    checkUserForgotPwdSecurityKey,
    userSetNewPassword,
};
