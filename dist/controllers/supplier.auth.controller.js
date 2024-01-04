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
const Supplier = require("../model/SUPPLIER_TBL");
const { ObjectId } = require("mongodb");
const NCache = require("../utils/NodeCache");
const { Error400, Error404, Error503, Success } = require("../res/response");
const Joi = require("joi");
const smtpSender = require("../services/email.service");
const { verify_email_html_template } = require("../templates/email.template");
const { generateJwtToken, generateSupplierDataToken, generateExpireTime, generateSixDigitNumber, generateUserDataToken, generateVerificationToken, } = require("../utils/generator");
const loginValidationSchema = Joi.object({
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
        .required(),
    password: Joi.string().required(),
});
/**
 * [async description]
 *
 * @param   {Request}       req   [req description]
 * @param   {Response}      res   [res description]
 * @param   {NextFunction}  next  [next description]
 *
 * @return  {[type]}              [return description]
 */
function supplierLogin(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Getting email and password from client
            const { email: inputEmail, password: inputPassword } = req.body;
            const { error, value } = yield loginValidationSchema.validate({
                email: inputEmail,
                password: inputPassword,
            });
            if (error)
                return res.status(400).json({ success: false, message: error === null || error === void 0 ? void 0 : error.details });
            const supplier = yield Supplier.findOne({
                "credentials.email": inputEmail,
            });
            if (!supplier)
                throw new Error404(`Account with ${inputEmail} not found!`);
            // comparing input password with hash password
            const passwordMatched = yield supplier.comparedPassword(inputPassword);
            if (!passwordMatched)
                throw new Error400("Password didn't matched !");
            const { credentials, _id, storeInformation, personalInformation, role, emailVerified, emailVerifyToken, status, fulfilled, } = supplier;
            if (!emailVerified || emailVerifyToken) {
                // generate verify token using jwt
                const newVerifyToken = generateVerificationToken({
                    email: inputEmail,
                    clientOrigin: req === null || req === void 0 ? void 0 : req.clientOrigin,
                });
                if (!newVerifyToken)
                    throw new Error503("Service unavailable!");
                // verify route
                const redirectUri = `${req === null || req === void 0 ? void 0 : req.appUri}api/v1/supplier/auth/verify-email?token=${newVerifyToken}`;
                supplier.emailVerifyToken = newVerifyToken;
                supplier.emailVerified = false;
                yield supplier.save();
                yield smtpSender({
                    to: inputEmail,
                    subject: "Verify email address",
                    html: verify_email_html_template(personalInformation === null || personalInformation === void 0 ? void 0 : personalInformation.fullName, redirectUri),
                });
                return res.status(200).json({
                    success: true,
                    message: `Verification email send to ${inputEmail}`,
                });
            }
            const token = generateJwtToken({
                _id,
                email: credentials === null || credentials === void 0 ? void 0 : credentials.email,
                storeName: storeInformation === null || storeInformation === void 0 ? void 0 : storeInformation.companyName,
                fullName: personalInformation === null || personalInformation === void 0 ? void 0 : personalInformation.fullName,
                contactEmail: personalInformation === null || personalInformation === void 0 ? void 0 : personalInformation.email,
                role,
            });
            const userDataToken = generateSupplierDataToken({
                _id,
                email: credentials === null || credentials === void 0 ? void 0 : credentials.email,
                storeName: storeInformation === null || storeInformation === void 0 ? void 0 : storeInformation.companyName,
                personalInformation,
                status,
                fulfilled,
                role,
            });
            return new Success(res, {
                message: "Login success...",
                data: {
                    action: "LOGIN_SUCCESS",
                    loginToken: token,
                    persistenceToken: userDataToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function supplierRegistration(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { credentialEmail, credentialPassword, credentialName } = req.body;
            const supplier = yield Supplier.findOne({
                "credentials.email": credentialEmail,
            });
            if (supplier)
                throw new Error400(`Account with ${credentialEmail} already present!`);
            // generate verify token using jwt
            const verifyToken = generateVerificationToken({ email: credentialEmail });
            if (!verifyToken)
                throw new Error503("Service unavailable!");
            // new supplier instance
            let newSupplier = new Supplier({
                credentials: {
                    name: credentialName,
                    email: credentialEmail,
                    password: credentialPassword,
                },
                emailVerified: false,
                emailVerifyToken: verifyToken,
                role: "SUPPLIER",
                status: "aspiring",
                fulfilled: false,
                statusHistory: [
                    {
                        name: "aspiring",
                        at: new Date(Date.now()),
                    },
                ],
            });
            yield newSupplier.save();
            const redirectUri = `${req === null || req === void 0 ? void 0 : req.appUri}api/v1/supplier/auth/verify-email?token=${verifyToken}`;
            yield smtpSender({
                to: credentialEmail,
                subject: "Verify email address",
                html: verify_email_html_template(credentialName, redirectUri),
            });
            return res.status(200).json({
                success: true,
                statusCode: 200,
                message: "Account created successfully. A verification email send to your email. Please verify...",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function supplierInformationConnect(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { supplierId } = req === null || req === void 0 ? void 0 : req.params;
            const { _id } = req === null || req === void 0 ? void 0 : req.decoded;
            const STATUS = "under review";
            if (supplierId !== _id)
                throw new Error400("Invalid id!");
            const { storeName, taxIdentificationNumber, registrationNumber, contactFullName, contactEmail, contactGender, postalCode, latitude, longitude, addressLabel, countryCode, contactPhone, landmark, docType, docId, } = req.body;
            let supplier = yield Supplier.findOne({
                $and: [{ _id: ObjectId(supplierId) }, { status: "aspiring" }],
            });
            if (!supplier)
                throw new Error503("Service unavailable!");
            const { statusHistory } = supplier;
            let newStatusHistory = statusHistory || [];
            newStatusHistory.push({ name: STATUS, at: new Date(Date.now()) });
            const file = req.file;
            if (!file) {
                throw new Error400("No files uploaded");
            }
            const docImageLink = "/supplier-verification-data/" + file.filename;
            let newSupplier = {
                storeInformation: {
                    storeName,
                    taxIdentificationNumber,
                    registrationNumber,
                },
                personalInformation: {
                    gender: contactGender,
                    fullName: contactFullName,
                    email: contactEmail,
                    countryCode,
                    phone: contactPhone,
                    address: {
                        label: addressLabel,
                        postalCode,
                        latitude,
                        longitude,
                        landmark,
                    },
                },
                documents: {
                    docImageLink,
                    docType,
                    docId,
                },
                status: STATUS,
                statusHistory: newStatusHistory,
            };
            yield Supplier.updateOne({
                $and: [{ fulfilled: false }, { _id: ObjectId(_id) }],
            }, Object.assign({}, newSupplier), {
                upsert: true,
            });
            return new Success(res, {
                message: "Seller information added successfully. Your account under review.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
// email validation
function supplierCredentialEmailValidation(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, clientOrigin } = req.decoded;
            const supplier = yield Supplier.findOne({
                $and: [{ "credentials.email": email }, { emailVerified: false }],
            });
            const clientUrl = `${clientOrigin}/email-confirmation?e=${email}`;
            if (!supplier)
                return res.redirect(`${clientUrl}`);
            supplier.emailVerifyToken = undefined;
            supplier.emailVerified = true;
            yield supplier.save();
            return res.redirect(`${clientUrl}`);
        }
        catch (error) {
            next(error);
        }
    });
}
function getAccountSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req === null || req === void 0 ? void 0 : req.decoded;
            const supplier = yield Supplier.findOne({
                "credentials.email": email,
            });
            if (!supplier)
                throw new Error404(`Account with ${email} not found!`);
            // comparing input password with hash password
            const { credentials, _id, storeInformation, personalInformation, role, status, fulfilled, } = supplier;
            const userDataToken = generateSupplierDataToken({
                _id,
                email: credentials === null || credentials === void 0 ? void 0 : credentials.email,
                storeName: storeInformation === null || storeInformation === void 0 ? void 0 : storeInformation.companyName,
                personalInformation,
                status,
                fulfilled,
                role,
            });
            return new Success(res, {
                message: "Account Refreshed.",
                data: {
                    action: "ACCOUNT_REFRESHED",
                    persistenceToken: userDataToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
module.exports = {
    supplierLogin,
    supplierRegistration,
    supplierInformationConnect,
    supplierCredentialEmailValidation,
    getAccountSystem,
};
