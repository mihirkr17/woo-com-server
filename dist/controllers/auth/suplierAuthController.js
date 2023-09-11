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
const Supplier = require("../../model/supplier.model");
// su[[nohdnasd; hidf
/**
 * @apiController --> Seller Registration Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.sellerRegistrationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let body = req.body;
        const { email, phone, password, fullName, } = body;
        let existUser = yield Supplier.countDocuments({ $or: [{ email }, { phone }] });
        if (existUser >= 1) {
            throw new apiResponse.Api400Error("User already exists, Please try another phone number or email address!");
        }
        // body['_uuid'] = "s" + generateUUID();
        body['authProvider'] = 'system';
        body["fullName"] = fullName;
        body['idFor'] = 'sell';
        body["role"] = "SELLER";
        body["contactEmail"] = email;
        body['verificationCode'] = generateSixDigitNumber();
        body['verificationExpiredAt'] = generateExpireTime();
        body["accountStatus"] = "inactive";
        // body["store"] = store || {};
        body["password"] = yield bcrypt.hash(password, 10);
        body["hasPassword"] = true;
        // const info = await email_service({
        //    to: email,
        //    subject: "Verify email address",
        //    html: verify_email_html_template(body?.verificationCode)
        // });
        // if (!info?.response) throw new apiResponse.Api500Error("Sorry registration failed !");
        let user = new Supplier(body);
        // user.buyer = undefined;
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
// Supplier login controller
/**
* @apiController --> All User Login Controller
* @apiMethod --> POST
* @apiRequired --> BODY
*/
module.exports.supplierLoginController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Getting email or phone number and password from client body;
        const { email: emailOrPhone, password: cPwd } = req.body;
        let supplier;
        try {
            supplier = yield Supplier.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] }, { createdAt: 0, __v: 0 });
        }
        catch (error) {
            return res.status(500).json({ success: false, statusCode: 500, message: "Internal Server Error !" });
        }
        if (!supplier || typeof supplier === "undefined")
            throw new apiResponse.Api400Error(`User with ${emailOrPhone} not found!`);
        // Fetching necessary data from exist account
        const { email, verificationCode, accountStatus, password } = supplier || {};
        // store matched password;
        try {
            const matchedPwd = yield bcrypt.compare(cPwd, password);
            if (!matchedPwd)
                throw new apiResponse.Api400Error("Password didn't matched !");
        }
        catch (error) {
            return res.status(500).send({ success: false, statusCode: 500, message: error === null || error === void 0 ? void 0 : error.message });
        }
        // if (verificationCode || accountStatus === "inactive") {
        //    supplier.verificationCode = generateSixDigitNumber();
        //    supplier.verificationExpiredAt = generateExpireTime();
        //    let updateUser = await supplier.save();
        //    const info = await email_service({
        //       to: email,
        //       subject: "Verify email address",
        //       html: verify_email_html_template(updateUser?.verificationCode)
        //    });
        //    if (!info?.response) throw new apiResponse.Api500Error("Internal error !");
        //    return res.status(200).send({
        //       success: true,
        //       statusCode: 200,
        //       returnEmail: updateUser?.email,
        //       verificationExpiredAt: updateUser?.verificationExpiredAt,
        //       message: `Verification code was sent to ${updateUser?.email}. Please verify your account.`,
        //    });
        // }
        const loginToken = generateJwtToken(supplier);
        const userDataToken = generateUserDataToken(supplier);
        if (!loginToken || !userDataToken)
            throw new apiResponse.Api400Error("Login failed due to internal issue !");
        // if all operation success then return the response
        return res.status(200).send({
            success: true,
            statusCode: 200,
            name: "Login",
            message: "Login success",
            uuid: supplier === null || supplier === void 0 ? void 0 : supplier._uuid,
            u_data: userDataToken,
            token: loginToken,
            role: supplier === null || supplier === void 0 ? void 0 : supplier.role
        });
    }
    catch (error) {
        next(error);
    }
});
