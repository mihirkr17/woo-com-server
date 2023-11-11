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
const Customer = require("../model/CUSTOMER_TBL");
const UserTbl = require("../model/user.model");
const db = require("mongodb");
module.exports = class UserService {
    /**
     * [findUserByEmail description]
     *
     * @param   {string}  email  [email description]
     *
     * @return  {[type]}         [return description]
     */
    findUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield UserTbl.findOne({ $and: [{ email: email }, { accountStatus: "Active" }] }, {
                    password: 0,
                    createdAt: 0,
                    phonePrefixCode: 0,
                    becomeSellerAt: 0,
                });
            }
            catch (error) {
                throw error;
            }
        });
    }
    /**
     * [async description]
     *
     * @param   {string<number>}   email  [email description]
     *
     * @return  {Promise<number>}         [return description]
     */
    countUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield UserTbl.countDocuments({ email });
            }
            catch (error) {
                throw error;
            }
        });
    }
};
