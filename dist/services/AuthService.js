"use strict";
// /src/services/AuthService.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const User = require("../model/CUSTOMER_TBL");
const { generateJwtToken } = require("../utils/generator");
class AuthService {
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield User.findOne({ email });
                if (!user)
                    throw new Error(`User with ${email} not found !`);
                const comparePwd = yield user.comparePassword(password);
                if (!comparePwd)
                    throw new Error("Password didn't match !");
                // generate a access token
                const token = generateJwtToken(user);
                return token;
            }
            catch (error) {
                throw error;
            }
        });
    }
}
