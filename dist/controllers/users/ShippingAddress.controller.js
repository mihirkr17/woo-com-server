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
const { findUserByEmail } = require("../../services/common.services");
const apiResponse = require("../../errors/apiResponse");
module.exports.createShippingAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userEmail = req.decoded.email;
        let body = req.body;
        if (!body || typeof body !== "object")
            throw new apiResponse.Api400Error("Required body !");
        const { name, division, city, area, area_type, landmark, phone_number, postal_code, default_shipping_address } = body;
        let shippingAddressModel = {
            addrsID: "spi_" + (Math.floor(Math.random() * 100000000)).toString(),
            name,
            division,
            city,
            area,
            area_type,
            landmark,
            phone_number,
            postal_code,
            default_shipping_address: default_shipping_address || false
        };
        const result = yield User.findOneAndUpdate({ email: userEmail }, { $push: { "buyer.shippingAddress": shippingAddressModel } }, { upsert: true });
        if (!result) {
            return res.status(400).send({
                success: false,
                statusCode: 400,
                message: "Failed to add address in this cart",
            });
        }
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Successfully shipping address added in your cart.",
        });
    }
    catch (error) {
        next(error);
    }
});
module.exports.updateShippingAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userEmail = req.decoded.email;
        const body = req.body;
        const result = yield User.updateOne({ email: userEmail }, {
            $set: {
                "buyer.shippingAddress.$[i]": body,
            },
        }, { arrayFilters: [{ "i.addrsID": body === null || body === void 0 ? void 0 : body.addrsID }] });
        if (result) {
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Shipping address updated.",
            });
        }
        else {
            throw new apiResponse.Api500Error("Failed to update shipping address.");
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.selectShippingAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const authEmail = req.decoded.email;
        let { addrsID, default_shipping_address } = req.body;
        if (!addrsID)
            throw new apiResponse.Api400Error("Required address id !");
        default_shipping_address = (default_shipping_address === true) ? false : true;
        const user = yield findUserByEmail(authEmail);
        if (!user && typeof user !== "object") {
            throw new apiResponse.Api403Error('User not found !!!');
        }
        const shippingAddress = ((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) || [];
        if (shippingAddress && shippingAddress.length > 0) {
            const result = yield User.findOneAndUpdate({ email: authEmail }, {
                $set: {
                    "buyer.shippingAddress.$[j].default_shipping_address": false,
                    "buyer.shippingAddress.$[i].default_shipping_address": default_shipping_address,
                },
            }, {
                arrayFilters: [{ "j.addrsID": { $ne: addrsID } }, { "i.addrsID": addrsID }],
                multi: true,
            });
            if (!result)
                throw new apiResponse.Api500Error("Server error !");
            return res.status(200).send({ success: true, statusCode: 200, message: "Default shipping address selected." });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports.deleteShippingAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.decoded.email;
        let addrsID = req.params.addrsID;
        if (!addrsID)
            throw new apiResponse.Api400Error("Required address id !");
        const result = yield User.findOneAndUpdate({ email: email }, { $pull: { "buyer.shippingAddress": { addrsID } } });
        if (result)
            return res.status(200).send({ success: true, statusCode: 200, message: "Address deleted successfully." });
    }
    catch (error) {
        next(error);
    }
});
