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
module.exports.createShippingAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userEmail = req.decoded.email;
        let body = req.body;
        body['addrsID'] = Math.floor(Math.random() * 100000000);
        body['default_shipping_address'] = false;
        const result = yield User.findOneAndUpdate({ email: userEmail }, { $push: { "buyer.shippingAddress": body } }, { upsert: true });
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
            return res.status(400).send({
                success: false,
                statusCode: 400,
                error: "Failed to update shipping address.",
            });
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
        default_shipping_address = (default_shipping_address === true) ? false : true;
        const user = yield findUserByEmail(authEmail);
        if (!user && typeof user !== "object") {
            return res.status(404).send({ success: false, statusCode: 404, message: 'User not found !!!' });
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
            if (!result) {
                return res.status(400).send({
                    success: false,
                    statusCode: 400,
                    message: "Failed to select the address",
                });
            }
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
        let saUid = req.params.addrsID;
        if (!saUid) {
            return res.status(400).send({ success: false, statusCode: 400, message: "Required address id !" });
        }
        saUid = parseInt(saUid);
        const result = yield User.findOneAndUpdate({ email: email }, { $pull: { "buyer.shippingAddress": { addrsID: saUid } } });
        if (result)
            return res.status(200).send({ success: true, statusCode: 200, message: "Address deleted successfully." });
    }
    catch (error) {
        next(error);
    }
});
