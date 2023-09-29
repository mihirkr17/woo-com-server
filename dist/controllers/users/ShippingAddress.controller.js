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
const { findUserByEmail } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
module.exports.createShippingAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userEmail = req.decoded.email;
        let body = req.body;
        if (!body || typeof body !== "object")
            throw new apiResponse.Api400Error("Required body !");
        if (!Object.values(body).some((e) => e !== null && e !== "")) {
            throw new apiResponse.Api400Error("Required all fields !");
        }
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
        if (!result)
            throw new apiResponse.Api500Error("Operation failed !");
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Shipping address added successfully.",
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
        if (!body || typeof body !== "object")
            throw new apiResponse.Api400Error("Required body !");
        if (!Object.values(body).some((e) => e !== null && e !== "")) {
            throw new apiResponse.Api400Error("Required all fields !");
        }
        const { addrsID, name, division, city, area, area_type, landmark, phone_number, postal_code, default_shipping_address } = body;
        if (!addrsID)
            throw new apiResponse.Api400Error("Required address id !");
        let shippingAddressModel = {
            addrsID,
            name,
            division,
            city,
            area,
            area_type,
            landmark,
            phone_number,
            postal_code,
            default_shipping_address
        };
        const result = yield User.findOneAndUpdate({ email: userEmail }, {
            $set: {
                "buyer.shippingAddress.$[i]": shippingAddressModel,
            },
        }, { arrayFilters: [{ "i.addrsID": addrsID }] });
        if (result) {
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Shipping address updated.",
            });
        }
        throw new apiResponse.Api500Error("Failed to update shipping address.");
    }
    catch (error) {
        next(error);
    }
});
module.exports.selectShippingAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        let { addrsID, default_shipping_address } = req.body;
        if (!addrsID || typeof addrsID !== "string")
            throw new apiResponse.Api400Error("Required address id !");
        default_shipping_address = (default_shipping_address === true) ? false : true;
        const user = yield findUserByEmail(authEmail);
        if (!user && typeof user !== "object") {
            throw new apiResponse.Api404Error('User not found !');
        }
        const shippingAddress = (user === null || user === void 0 ? void 0 : user.shippingAddress) || [];
        if (shippingAddress && shippingAddress.length > 0) {
            const result = yield User.findOneAndUpdate({ email: authEmail }, {
                $set: {
                    "shippingAddress.$[j].default_shipping_address": false,
                    "shippingAddress.$[i].default_shipping_address": default_shipping_address,
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
        if (!addrsID || typeof addrsID !== "string")
            throw new apiResponse.Api400Error("Required address id !");
        const result = yield User.findOneAndUpdate({ email: email }, { $pull: { "buyer.shippingAddress": { addrsID } } });
        if (result)
            return res.status(200).send({ success: true, statusCode: 200, message: "Address deleted successfully." });
    }
    catch (error) {
        next(error);
    }
});
