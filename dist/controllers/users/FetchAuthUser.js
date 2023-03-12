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
const { productCounter } = require("../../model/common.model");
const User = require("../../model/user.model");
const ShoppingCart = require("../../model/shoppingCart.model");
const response = require("../../errors/apiResponse");
const setUserDataToken = require("../../utils/setUserDataToken");
module.exports = function FetchAuthUser(req, res, next) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const authEmail = req.decoded.email;
            const role = req.decoded.role;
            const UUID = req.decoded._UUID;
            const uuid = req.headers.authorization || "";
            let result;
            const ipAddress = (_a = req.socket) === null || _a === void 0 ? void 0 : _a.remoteAddress;
            result = yield User.findOne({
                $and: [{ email: authEmail }, { role: role }, { accountStatus: 'active' }]
            }, {
                password: 0, createdAt: 0,
                phonePrefixCode: 0,
                becomeSellerAt: 0
            });
            if (result && (result === null || result === void 0 ? void 0 : result.role) === 'SELLER' && (result === null || result === void 0 ? void 0 : result.idFor) === 'sell') {
                yield productCounter({ storeName: (_b = result.seller.storeInfos) === null || _b === void 0 ? void 0 : _b.storeName, _UUID: result === null || result === void 0 ? void 0 : result._UUID });
            }
            if (result && (result === null || result === void 0 ? void 0 : result.role) === 'BUYER' && (result === null || result === void 0 ? void 0 : result.idFor) === 'buy') {
                result.buyer["defaultShippingAddress"] = (Array.isArray((_c = result === null || result === void 0 ? void 0 : result.buyer) === null || _c === void 0 ? void 0 : _c.shippingAddress) &&
                    ((_d = result === null || result === void 0 ? void 0 : result.buyer) === null || _d === void 0 ? void 0 : _d.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
                result.buyer["shoppingCartItems"] = yield ShoppingCart.countDocuments({ customerEmail: result === null || result === void 0 ? void 0 : result.email });
            }
            if (!result || typeof result !== "object") {
                throw new response.Api404Error("AuthError", "User not found !");
            }
            let user = {
                _UUID: result === null || result === void 0 ? void 0 : result._UUID,
                fullName: result === null || result === void 0 ? void 0 : result.fullName,
                email: result === null || result === void 0 ? void 0 : result.email,
                phone: result === null || result === void 0 ? void 0 : result.phone,
                phonePrefixCode: result === null || result === void 0 ? void 0 : result.phonePrefixCode,
                hasPassword: result === null || result === void 0 ? void 0 : result.hasPassword,
                role: result === null || result === void 0 ? void 0 : result.role,
                gender: result === null || result === void 0 ? void 0 : result.gender,
                dob: result === null || result === void 0 ? void 0 : result.dob,
                idFor: result === null || result === void 0 ? void 0 : result.idFor,
                accountStatus: result === null || result === void 0 ? void 0 : result.accountStatus,
                authProvider: result === null || result === void 0 ? void 0 : result.authProvider,
                contactEmail: result === null || result === void 0 ? void 0 : result.contactEmail,
                buyer: result === null || result === void 0 ? void 0 : result.buyer
            };
            res.cookie("u_data", setUserDataToken(user), { httpOnly: false, maxAge: 57600000, sameSite: "none", secure: true });
            return res.status(200).send({ success: true, statusCode: 200, message: 'Welcome ' + (result === null || result === void 0 ? void 0 : result.fullName), data: user, ipAddress });
        }
        catch (error) {
            next(error);
        }
    });
};
