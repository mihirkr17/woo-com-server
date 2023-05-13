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
const bcrypt = require("bcrypt");
const email_service = require("../../services/email.service");
const { verify_email_html_template } = require("../../templates/email.template");
const { generateUUID, generateExpireTime, generateSixDigitNumber, generateJwtToken, generateUserDataToken } = require("../../utils/generator");
const { validEmail, validPassword } = require("../../utils/validator");
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
        const [userResult, emailResult] = yield Promise.all([
            new User(body).save(),
            email_service({
                to: body === null || body === void 0 ? void 0 : body.email,
                subject: "Verify email address",
                html: verify_email_html_template(body === null || body === void 0 ? void 0 : body.verificationCode)
            })
        ]);
        if (!(emailResult === null || emailResult === void 0 ? void 0 : emailResult.response))
            throw new apiResponse.Api400Error("Verification code not send to your email !");
        return res.status(200).send({
            success: true,
            statusCode: 200,
            returnEmail: userResult === null || userResult === void 0 ? void 0 : userResult.email,
            verificationExpiredAt: userResult === null || userResult === void 0 ? void 0 : userResult.verificationExpiredAt,
            message: `Thanks for your information. Verification code was send to ${userResult === null || userResult === void 0 ? void 0 : userResult.email}`,
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
        const { email, phone, password, store } = body;
        let existUser = yield User.countDocuments({ $or: [{ email }, { phone }] });
        if (existUser >= 1) {
            throw new apiResponse.Api400Error("User already exists, Please try another phone number or email address !");
        }
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
        if (!(info === null || info === void 0 ? void 0 : info.response))
            throw new apiResponse.Api500Error("Sorry registration failed !");
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
    catch (error) {
        next(error);
    }
});
module.exports.generateNewVerificationCode = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.query;
        if (!email)
            throw new apiResponse.Api400Error("Required email address !");
        if (!validEmail(email))
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
        if (verificationCode.length >= 7 || verificationCode <= 5)
            throw new apiResponse.Api400Error("Verification code should be 6 digits !");
        if (new Date(verificationExpiredAt) < new Date() === true)
            throw new apiResponse.Api400Error("Session expired ! Please resend code ..");
        let user = yield User.findOne({ $and: [{ verificationCode }, { email }] });
        if (!user)
            throw new apiResponse.Api400Error("Session expired !");
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
    try {
        const { emailOrPhone, cPwd } = req.body;
        let user = yield User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] }, { createdAt: 0, __v: 0 });
        if (!user)
            throw new apiResponse.Api400Error(`User with ${emailOrPhone} not found!`);
        const { email, verificationCode, accountStatus, password } = user || {};
        const matchedPwd = yield bcrypt.compare(cPwd, password);
        if (!matchedPwd)
            throw new apiResponse.Api400Error("Password didn't matched !");
        if (verificationCode || accountStatus === "inactive") {
            user.verificationCode = generateSixDigitNumber();
            user.verificationExpiredAt = generateExpireTime();
            let updateUser = yield user.save();
            const info = yield email_service({
                to: email,
                subject: "Verify email address",
                html: verify_email_html_template(updateUser === null || updateUser === void 0 ? void 0 : updateUser.verificationCode)
            });
            if (!(info === null || info === void 0 ? void 0 : info.response))
                throw new apiResponse.Api500Error("Internal error !");
            return res.status(200).send({
                success: true,
                statusCode: 200,
                returnEmail: updateUser === null || updateUser === void 0 ? void 0 : updateUser.email,
                verificationExpiredAt: updateUser === null || updateUser === void 0 ? void 0 : updateUser.verificationExpiredAt,
                message: `Verification code was sent to ${updateUser === null || updateUser === void 0 ? void 0 : updateUser.email}. Please verify your account.`,
            });
        }
        const loginToken = generateJwtToken(user);
        const userDataToken = generateUserDataToken(user);
        if (!loginToken || !userDataToken)
            throw new apiResponse.Api400Error("Login failed due to internal issue !");
        // if all operation success then return the response
        return res.status(200).send({
            success: true,
            statusCode: 200,
            name: "Login",
            message: "Login success",
            uuid: user === null || user === void 0 ? void 0 : user._uuid,
            u_data: userDataToken,
            token: loginToken,
            role: user === null || user === void 0 ? void 0 : user.role
        });
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
        const { email } = req.decoded;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword)
            throw new apiResponse.Api400Error(`Required old password and new password !`);
        if (newPassword && typeof newPassword !== "string")
            throw new apiResponse.Api400Error("Password should be string !");
        if (newPassword.length < 5 || newPassword.length > 8)
            throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");
        if (!validPassword(newPassword))
            throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
        // find user in db by email
        let user = yield User.findOne({ email: email });
        if (!user && typeof user !== "object")
            throw new apiResponse.Api404Error(`User not found !`);
        const comparedPassword = yield bcrypt.compare(oldPassword, user === null || user === void 0 ? void 0 : user.password);
        if (!comparedPassword) {
            throw new apiResponse.Api400Error("Password didn't match !");
        }
        let hashedPwd = yield bcrypt.hash(newPassword, 10);
        if (!hashedPwd)
            throw new apiResponse.Api500Error("Internal errors !");
        user.password = hashedPwd;
        const result = yield user.save();
        return result && res.status(200).send({ success: true, statusCode: 200, message: "Password updated successfully." });
    }
    catch (error) {
        next(error);
    }
});
module.exports.checkUserAuthenticationByEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req === null || req === void 0 ? void 0 : req.body;
        if (!email || !validEmail(email))
            throw new apiResponse.Api400Error("Required valid email address !");
        const user = yield User.findOne({ email });
        if (!user || typeof user === "undefined")
            throw new apiResponse.Api404Error(`Sorry user not found with this ${email}`);
        const securityCode = generateSixDigitNumber();
        const lifeTime = 300000;
        const info = yield email_service({
            to: email,
            subject: 'Reset your WooKart Password',
            html: `<p>Your Security Code is <b style="font-size: 1.5rem">${securityCode}</b> and expire in 5 minutes.</p>`
        });
        if (!(info === null || info === void 0 ? void 0 : info.response))
            throw new apiResponse.Api500Error("Sorry ! Something wrong in your email. please provide valid email address.");
        res.cookie("securityCode", securityCode, { httpOnly: true, sameSite: "none", secure: true, maxAge: lifeTime });
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "We have to send security code to your email..",
            lifeTime,
            email
        });
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
        const life = 120000;
        res.cookie("set_new_pwd_session", securityCode, { httpOnly: true, sameSite: "none", secure: true, maxAge: life });
        return res.status(200).send({ success: true, statusCode: 200, message: "Success. Please set a new password.", data: { email: user === null || user === void 0 ? void 0 : user.email, securityCode, sessionLifeTime: life } });
    }
    catch (error) {
        next(error);
    }
});
module.exports.userSetNewPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { set_new_pwd_session } = req.cookies;
        if (!set_new_pwd_session)
            throw new apiResponse.Api400Error("Sorry ! your session is expired !");
        const { email, password, securityCode } = req.body;
        if (securityCode !== set_new_pwd_session)
            throw new apiResponse.Api400Error("Invalid security code !");
        if (!email || !validEmail(email))
            throw new apiResponse.Api400Error("Required valid email address !");
        if (password.length < 5 || password.length > 8)
            throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");
        if (!validPassword(password) || typeof password !== "string")
            throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
        const user = yield User.findOne({ email });
        if (!user && typeof user !== "object")
            throw new apiResponse.Api404Error(`User not found!`);
        const hashedPwd = yield bcrypt.hash(password, 10);
        const result = hashedPwd ? yield User.findOneAndUpdate({ email }, { $set: { password: hashedPwd } }, { upsert: true }) : false;
        res.clearCookie('set_new_pwd_session');
        if (!result)
            throw new apiResponse.Api500Error("Something wrong in server !");
        return res.status(200).send({ success: true, statusCode: 200, message: "Password updated successfully." });
    }
    catch (error) {
        next(error);
    }
});
