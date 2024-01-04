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
const { Error400 } = require("../res/response");
const { validPassword, validEmail, validString, validBDPhoneNumber } = require("../utils/validator");
module.exports.loginMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        if (!email)
            throw new Error400("Required email address !");
        if (!validString(email))
            throw new Error400("Invalid string type !");
        if (!password)
            throw new Error400("Required password !");
        if (typeof password !== "string")
            throw new Error400("Password should be string !");
        if (!validPassword(password))
            throw new Error400("Password should contains at least 1 digit, lowercase letter, special character !");
        if (password.length < 5 || password.length > 8)
            throw new Error400("Password length should be 5 to 8 characters !");
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
            throw new Error400("Required phone number !");
        }
        else if (!email) {
            throw new Error400("Required email address !");
        }
        else if (!gender) {
            throw new Error400("Required gender !");
        }
        else if (!fullName) {
            throw new Error400("Required full name !");
        }
        else if (!password) {
            throw new Error400("Required password !");
        }
        else if (password && typeof password !== "string") {
            throw new Error400("Password should be string !");
        }
        else if (password.length < 5 || password.length > 8) {
            throw new Error400("Password length should be 5 to 8 characters !");
        }
        else if (!validPassword(password)) {
            throw new Error400("Password should contains at least 1 digit, lowercase letter, special character !");
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
    try {
        const body = req.body;
        const requiredGenderValues = ["Male", "Female", "Others"];
        const { email, phone, fullName, password, gender } = body;
        const errors = [];
        const phnNumber = validBDPhoneNumber(phone);
        if (!fullName || fullName.length < 3 || fullName.length > 18) {
            errors.push("Full name characters length should be 3 to 18!");
        }
        if (!email || !validEmail(email)) {
            errors.push("Invalid email address!");
        }
        if (!phnNumber) {
            errors.push("Invalid phone number!");
        }
        else {
            req.body.phone = phnNumber;
        }
        if (!password || typeof password !== "string" || password.length < 5 || password.length > 8 || !validPassword(password)) {
            errors.push("Invalid password format!");
        }
        if (!gender || !requiredGenderValues.includes(gender)) {
            errors.push("Invalid gender format!");
        }
        if (errors.length > 0) {
            throw new Error400(errors.join(" "));
        }
        // Continue with registration logic if all validations pass
        next();
    }
    catch (error) {
        next(error);
    }
});
