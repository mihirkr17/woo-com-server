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
const User = require("../../model/user.model");
const apiResponse = require("../../errors/apiResponse");
const { findUserByEmail } = require("../../services/common.service");
module.exports.addToWishlistHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userEmail = req.params.email;
        const verifiedEmail = req.decoded.email;
        const body = req.body;
        if (userEmail !== verifiedEmail) {
            throw new apiResponse.Api403Error("Forbidden !");
        }
        if (!body || typeof body === "undefined") {
            throw new apiResponse.Api400Error("Required body !");
        }
        const { productID, variationID, listingID } = body;
        let model = {
            productID,
            variationID,
            listingID
        };
        let user = yield findUserByEmail(verifiedEmail);
        if (user) {
            let existsProduct = (Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.wishlist) && ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.wishlist.filter((e) => ((e === null || e === void 0 ? void 0 : e.productID) === (body === null || body === void 0 ? void 0 : body.productID) && (e === null || e === void 0 ? void 0 : e.variationID) === (body === null || body === void 0 ? void 0 : body.variationID))))) || [];
            if (existsProduct && existsProduct.length >= 1) {
                return res.status(200).send({ success: true, statusCode: 200, message: "Product Has Already In Your Wishlist" });
            }
            const wishlistRes = yield User.findOneAndUpdate({ email: userEmail }, { $push: { "buyer.wishlist": model } }, { upsert: true });
            return res.status(200).send({
                success: true,
                statusCode: 200,
                data: wishlistRes,
                message: "Product Added To Your wishlist",
            });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.removeFromWishlist = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productID = req.params.productID;
        const userEmail = req.decoded.email;
        const result = yield User.findOneAndUpdate({ email: userEmail }, { $pull: { "buyer.wishlist": { productID } } });
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Product removed from your wishlist" });
        }
        else {
            throw new apiResponse.Api500Error("Service unavailable");
        }
    }
    catch (error) {
        next(error);
    }
});
