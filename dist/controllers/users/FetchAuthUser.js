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
const ShoppingCart = require("../../model/shoppingCart.model");
const apiResponse = require("../../errors/apiResponse");
const setUserDataToken = require("../../utils/setUserDataToken");
module.exports = function FetchAuthUser(req, res, next) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const authEmail = req.decoded.email;
            let userDataToken;
            // const ipAddress = req.socket?.remoteAddress;
            let user = yield findUserByEmail(authEmail);
            if (!user || typeof user !== "object")
                throw new apiResponse.Api404Error("User not found !");
            if ((user === null || user === void 0 ? void 0 : user.role) === 'SELLER' && (user === null || user === void 0 ? void 0 : user.idFor) === 'sell') {
                yield productCounter({ storeName: (_a = user.seller.storeInfos) === null || _a === void 0 ? void 0 : _a.storeName, _uuid: user === null || user === void 0 ? void 0 : user._uuid });
            }
            if ((user === null || user === void 0 ? void 0 : user.role) === 'BUYER' && (user === null || user === void 0 ? void 0 : user.idFor) === 'buy') {
                user.buyer["defaultShippingAddress"] = (Array.isArray((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress) &&
                    ((_c = user === null || user === void 0 ? void 0 : user.buyer) === null || _c === void 0 ? void 0 : _c.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0])) || {};
                user.buyer["shoppingCartItems"] = (yield ShoppingCart.countDocuments({ customerEmail: user === null || user === void 0 ? void 0 : user.email })) || 0;
                userDataToken = setUserDataToken({
                    _uuid: user === null || user === void 0 ? void 0 : user._uuid,
                    fullName: user === null || user === void 0 ? void 0 : user.fullName,
                    email: user === null || user === void 0 ? void 0 : user.email,
                    phone: user === null || user === void 0 ? void 0 : user.phone,
                    phonePrefixCode: user === null || user === void 0 ? void 0 : user.phonePrefixCode,
                    hasPassword: user === null || user === void 0 ? void 0 : user.hasPassword,
                    role: user === null || user === void 0 ? void 0 : user.role,
                    gender: user === null || user === void 0 ? void 0 : user.gender,
                    dob: user === null || user === void 0 ? void 0 : user.dob,
                    idFor: user === null || user === void 0 ? void 0 : user.idFor,
                    accountStatus: user === null || user === void 0 ? void 0 : user.accountStatus,
                    contactEmail: user === null || user === void 0 ? void 0 : user.contactEmail,
                    buyer: user === null || user === void 0 ? void 0 : user.buyer,
                    authProvider: user === null || user === void 0 ? void 0 : user.authProvider
                });
            }
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
