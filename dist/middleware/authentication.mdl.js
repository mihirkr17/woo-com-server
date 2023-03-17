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
const response = require("../errors/apiResponse");
module.exports.loginMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { emailOrPhone, password, authProvider } = req.body;
        if (authProvider === "thirdParty") {
            next();
            return;
        }
        if (!emailOrPhone) {
            throw new response.Api400Error("ClientError", "Required email or phone number !");
        }
        else if (!password) {
            throw new response.Api400Error("ClientError", "Required password !");
        }
        else if (typeof password !== "string") {
            throw new response.Api400Error("ClientError", "Password should be string !");
        }
        else if (password.length < 5 || password.length > 8) {
            throw new response.Api400Error("ClientError", "Password length should be 5 to 8 characters !");
        }
        else {
            next();
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.registrationMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let body = req.body;
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{5,}$/;
        const { phone, email, password, gender, fullName, dob } = body;
        if (!phone) {
            throw new response.Api400Error("ClientError", "Required phone number !");
        }
        else if (!email) {
            throw new response.Api400Error("ClientError", "Required email address !");
        }
        else if (!gender) {
            throw new response.Api400Error("ClientError", "Required gender !");
        }
        else if (!fullName) {
            throw new response.Api400Error("ClientError", "Required full name !");
        }
        else if (!dob) {
            throw new response.Api400Error("ClientError", "Required date of birth !");
        }
        else if (!password) {
            throw new response.Api400Error("ClientError", "Required password !");
        }
        else if (password && typeof password !== "string") {
            throw new response.Api400Error("ClientError", "Password should be string !");
        }
        else if (password.length < 5 || password.length > 8) {
            throw new response.Api400Error("ClientError", "Password length should be 5 to 8 characters !");
        }
        else if (!passwordRegex.test(password)) {
            throw new response.Api400Error("ClientError", "Password should contains at least 1 digit, lowercase letter, special character !");
        }
        else {
            next();
        }
    }
    catch (error) {
        next(error);
    }
});
