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
const apiResponse = require("../errors/apiResponse");
const { isValidPassword, isValidEmail, isValidString } = require("../utils/validator");
module.exports.loginMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { emailOrPhone, cPwd } = req.body;
    try {
        if (!emailOrPhone)
            throw new apiResponse.Api400Error("Required email or phone number !");
        if (!isValidString(emailOrPhone))
            throw new apiResponse.Api400Error("Invalid string type !");
        if (!cPwd)
            throw new apiResponse.Api400Error("Required password !");
        if (typeof cPwd !== "string")
            throw new apiResponse.Api400Error("Password should be string !");
        if (!isValidPassword(cPwd))
            throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
        if (cPwd.length < 5 || cPwd.length > 8)
            throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");
        next();
    }
    catch (error) {
        next(error);
    }
});
module.exports.registrationMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone, email, password, gender, fullName } = req === null || req === void 0 ? void 0 : req.body;
        if (!phone) {
            throw new apiResponse.Api400Error("Required phone number !");
        }
        else if (!email) {
            throw new apiResponse.Api400Error("Required email address !");
        }
        else if (!gender) {
            throw new apiResponse.Api400Error("Required gender !");
        }
        else if (!fullName) {
            throw new apiResponse.Api400Error("Required full name !");
        }
        else if (!password) {
            throw new apiResponse.Api400Error("Required password !");
        }
        else if (password && typeof password !== "string") {
            throw new apiResponse.Api400Error("Password should be string !");
        }
        else if (password.length < 5 || password.length > 8) {
            throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");
        }
        else if (!isValidPassword(password)) {
            throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
        }
        else {
            next();
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.sellerRegistrationMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    const { email, phone, fullName, password, store } = body;
    // const { name, license, address } = store;
    if (!email)
        throw new apiResponse.Api400Error("Required email address !");
    if (!isValidEmail(email))
        throw new apiResponse.Api400Error("Required valid email address !");
    if (!password)
        throw new apiResponse.Api400Error(`Required password !`);
    if (password && typeof password !== "string")
        throw new apiResponse.Api400Error("Password should be string !");
    if (password.length < 5 || password.length > 8)
        throw new apiResponse.Api400Error("Password length should be 5 to 8 characters !");
    if (!isValidPassword(password))
        throw new apiResponse.Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
    next();
});
