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
const { Api400Error } = require("../errors/apiResponse");
const { validPassword, validEmail, validString } = require("../utils/validator");
module.exports.loginMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { emailOrPhone, cPwd } = req.body;
    try {
        if (!emailOrPhone)
            throw new Api400Error("Required email or phone number !");
        if (!validString(emailOrPhone))
            throw new Api400Error("Invalid string type !");
        if (!cPwd)
            throw new Api400Error("Required password !");
        if (typeof cPwd !== "string")
            throw new Api400Error("Password should be string !");
        if (!validPassword(cPwd))
            throw new Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
        if (cPwd.length < 5 || cPwd.length > 8)
            throw new Api400Error("Password length should be 5 to 8 characters !");
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
            throw new Api400Error("Required phone number !");
        }
        else if (!email) {
            throw new Api400Error("Required email address !");
        }
        else if (!gender) {
            throw new Api400Error("Required gender !");
        }
        else if (!fullName) {
            throw new Api400Error("Required full name !");
        }
        else if (!password) {
            throw new Api400Error("Required password !");
        }
        else if (password && typeof password !== "string") {
            throw new Api400Error("Password should be string !");
        }
        else if (password.length < 5 || password.length > 8) {
            throw new Api400Error("Password length should be 5 to 8 characters !");
        }
        else if (!validPassword(password)) {
            throw new Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
        }
        else {
            next();
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.supplierRegistrationMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    const requiredGenderValue = ["Male", "Female", "Others"];
    const { email, phone, fullName, password, gender } = body;
    if (!fullName)
        throw new Api400Error("Required full name !");
    if (fullName.length < 3 || fullName.length > 18)
        throw new Api400Error("Full name characters length should be 3 to 18 !");
    if (!email)
        throw new Api400Error("Required email address !");
    if (!validEmail(email))
        throw new Api400Error("Required valid email address !");
    if (!phone)
        throw new Api400Error("Required phone number !");
    if (!password)
        throw new Api400Error(`Required password !`);
    if (password && typeof password !== "string")
        throw new Api400Error("Password should be string !");
    if (password.length < 5 || password.length > 8)
        throw new Api400Error("Password length should be 5 to 8 characters !");
    if (!validPassword(password))
        throw new Api400Error("Password should contains at least 1 digit, lowercase letter, special character !");
    if (!gender)
        return new Api400Error("Required gender !");
    if (!requiredGenderValue.includes(gender))
        return new Api400Error("Invalid gender format !");
    next();
});
