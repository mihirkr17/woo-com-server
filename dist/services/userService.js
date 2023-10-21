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
const User = require("../model/user.model");
/**
 * [async description]
 *
 * @param   {string<number>}   email  [email description]
 *
 * @return  {Promise<number>}         [return description]
 */
function countUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield User.countDocuments({ email });
        }
        catch (error) {
            throw error;
        }
    });
}
/**
 * [async description]
 *
 * @param   {string<any>}   email  [email description]
 *
 * @return  {Promise<any>}         [return description]
 */
function findUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield User.findOne({ email }, { createdAt: 0, __v: 0 });
        }
        catch (error) {
            throw error;
        }
    });
}
module.exports = { countUserByEmail, findUserByEmail };
