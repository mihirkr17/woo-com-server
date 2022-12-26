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
const emailValidator = require("../helpers/emailValidator");
module.exports = function userRegisterMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { username, email, password } = req.body;
            if (!req.body) {
                return res.status(400).send({ success: false, statusCode: 400, error: "Information not found !!!" });
            }
            if (username.length <= 3 && username.length >= 9) {
                return res.status(400).send({ success: false, statusCode: 400, error: 'Username length must between 4 to 8 characters !!!' });
            }
            if (email.length <= 0) {
                return res.status(400).send({ success: false, statusCode: 400, error: 'Email address required !!!' });
            }
            if (!emailValidator(email)) {
                return res.status(400).send({ success: false, statusCode: 400, error: 'Invalid email address !!!' });
            }
            if (password.length <= 0) {
                return res.status(400).send({ success: false, statusCode: 400, error: 'Password required !!!' });
            }
            if (password.length <= 4) {
                return res.status(400).send({ success: false, statusCode: 400, error: 'Password must be greater than 5 characters !!!' });
            }
            next();
        }
        catch (error) {
            return res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
        }
    });
};
