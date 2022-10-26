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
var conn = require("../utils/db");
var mongodb = require("mongodb");
module.exports = function CountAllProducts(user) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let db = yield conn.dbConnection();
            return yield db.collection('products').countDocuments({ $and: [{ status: 'active' }, { save_as: 'fulfilled' }] });
        }
        catch (error) {
            return error.message;
        }
    });
};
