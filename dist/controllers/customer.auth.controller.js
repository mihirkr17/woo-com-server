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
const Customer = require("../model/CUSTOMER_TBL");
const { ObjectId } = require("mongodb");
const NCache = require("../utils/NodeCache");
const { Error400, Error404 } = require("../res/response");
const smtpSender = require("../services/email.service");
const { verify_email_html_template, send_six_digit_otp_template, } = require("../templates/email.template");
const { generateSixDigitNumber, generateJwtToken, generateUserDataToken, generateVerificationToken, } = require("../utils/generator");
const { validEmail, validPassword, validDigit, validBDPhoneNumber, } = require("../utils/validator");
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
            let user = yield Customer.findOne({ email: inputEmail });
            if (!user)
                throw new Error400(`User with ${inputEmail} not found!`);
            const { email, verified, accountStatus, fullName, devices } = user || {};
            const matchedPwd = yield user.comparePassword(inputPassword);
            if (!matchedPwd)
                throw new Error400("Password didn't matched !");
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
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function registrationSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let body = req.body;
            const requiredRoles = ["buyer", "supplier", "admin"];
            const origin = req.headers.referer || req.headers.origin || req.headers.host;
            const headersRole = req.headers.role || "";
            let existUser = yield Customer.countDocuments({ email: body === null || body === void 0 ? void 0 : body.email });
            if (existUser >= 1)
                throw new Error400("User already exists, Please try another email address !");
            const verifyToken = generateVerificationToken({ email: body === null || body === void 0 ? void 0 : body.email });
            const emailResult = yield smtpSender({
                to: body === null || body === void 0 ? void 0 : body.email,
                subject: "Verify email address",
                html: verify_email_html_template(verifyToken, body === null || body === void 0 ? void 0 : body.fullName, req === null || req === void 0 ? void 0 : req.appUri),
            });
            if (!(emailResult === null || emailResult === void 0 ? void 0 : emailResult.response))
                throw new Error400("Verification code not send to your email !");
            if (headersRole === "buyer") {
                body["role"] = "CUSTOMER";
                body["idFor"] = "buy";
            }
            if (headersRole === "SUPPLIER") {
                body["role"] = "SUPPLIER";
                body["idFor"] = "sell";
            }
            if (headersRole === "admin") {
                body["role"] = "ADMIN";
                body["idFor"] = "administration";
            }
            const newUser = new Customer(body);
            yield newUser.save();
            if (headersRole === "buyer") {
                const newCustomer = new Customer({
                    userId: newUser === null || newUser === void 0 ? void 0 : newUser._id,
                });
                yield newCustomer.save();
            }
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
module.exports = { loginSystem, registrationSystem };
