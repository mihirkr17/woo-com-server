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
const { Api400Error, Api500Error } = require("../../errors/apiResponse");
const email_service = require("../../services/email.service");
const { verify_email_html_template } = require("../../templates/email.template");
const { generateVerificationToken, generateJwtToken, generateUserDataToken } = require("../../utils/generator");
const Supplier = require("../../model/supplier.model");
/**
 * @apiController --> Seller Registration Controller
 * @apiMethod --> POST
 * @apiRequired --> BODY
 */
module.exports.supplierRegistrationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let body = req.body;
        const { email, phone } = body;
        let existUser = yield Supplier.countDocuments({ $or: [{ email }, { phone }] });
        if (existUser >= 1) {
            throw new Api400Error("User already exists, Please try another phone number or email address!");
        }
        const verifyToken = generateVerificationToken(email);
        if (!verifyToken)
            throw new Api500Error("Internal server error !");
        const info = yield email_service({
            to: email,
            subject: "Verify email address",
            html: verify_email_html_template(verifyToken)
        });
        if (!(info === null || info === void 0 ? void 0 : info.response))
            throw new Api500Error("Sorry registration failed. Internal Error !");
        const user = new Supplier(body);
        yield user.save();
        return res.status(200).send({
            success: true,
            statusCode: 200,
            returnEmail: email,
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
        let supplier = yield Supplier.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] }, { createdAt: 0, __v: 0 });
        if (!supplier || typeof supplier === "undefined")
            throw new Api400Error(`User with ${emailOrPhone} not found!`);
        // Fetching necessary data from exist account
        const { email, verified, accountStatus } = supplier || {};
        // store matched password;
        const matchedPwd = yield supplier.comparePassword(cPwd); //bcrypt.compare(cPwd, password);
        if (!matchedPwd)
            throw new Api400Error("Password didn't matched !");
        if (!verified || accountStatus === "Inactive") {
            const verifyToken = generateVerificationToken(email);
            const info = yield email_service({
                to: email,
                subject: "Verify email address",
                html: verify_email_html_template(verifyToken)
            });
            if (!(info === null || info === void 0 ? void 0 : info.response))
                throw new Api500Error("Internal error !");
            return res.status(200).send({
                success: true,
                statusCode: 200,
                returnEmail: email,
                message: `Verification code was sent to ${email}. Please verify your account.`,
            });
        }
        const loginToken = generateJwtToken(supplier);
        const userDataToken = generateUserDataToken(supplier);
        if (!loginToken || !userDataToken)
            throw new Api400Error("Login failed due to internal issue !");
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
        console.log(error);
        next(error);
    }
});
/**
 * @controller --> registration verify by token
 */
module.exports.supplierAccountVerifyByEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.decoded;
        let supplier = yield Supplier.findOne({ email });
        if (!supplier)
            throw new Api400Error(`Sorry account with ${email} not found`);
        if (supplier.verified && supplier.accountStatus === "Active")
            return res.status(200).send({ success: true, statusCode: 200, message: "Congratulation your account already verified" });
        supplier.verified = true;
        supplier.accountStatus = "Active";
        yield supplier.save();
        return res.status(200).send({ success: true, statusCode: 200, message: `Congrats! Account with ${email} verification complete.`, returnEmail: email });
    }
    catch (error) {
        next(error);
    }
});
