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
const { productCounter, findUserByEmail } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const { generateUserDataToken } = require("../../utils/generator");
module.exports = function FetchAuthUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const authEmail = req.decoded.email;
            // const ipAddress = req.socket?.remoteAddress;
            let user = yield findUserByEmail(authEmail);
            if (!user || typeof user !== "object")
                throw new apiResponse.Api404Error("User not found !");
            const userDataToken = generateUserDataToken(user);
            if (!userDataToken)
                throw new apiResponse.Api500Error("Internal issue !");
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: 'Welcome ' + (user === null || user === void 0 ? void 0 : user.fullName),
                u_data: userDataToken
            });
        }
        catch (error) {
            next(error);
        }
    });
};
