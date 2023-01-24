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
module.exports.createShippingAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userEmail = req.decoded.email;
        let body = req.body;
        body['_SA_UID'] = Math.floor(Math.random() * 100000000);
        body['default_shipping_address'] = false;
        const result = yield User.updateOne({ email: userEmail }, { $push: { "buyer.shippingAddress": body } }, { new: true });
        if (!result) {
            return res.status(400).send({
                success: false,
                statusCode: 400,
                error: "Failed to add address in this cart",
            });
        }
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Successfully shipping address added in your cart.",
        });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.updateShippingAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const db = await dbc.dbConnection();
        const userEmail = req.decoded.email;
        const body = req.body;
        const result = yield User.updateOne({ email: userEmail }, {
            $set: {
                "buyer.shippingAddress.$[i]": body,
            },
        }, { arrayFilters: [{ "i._SA_UID": body === null || body === void 0 ? void 0 : body._SA_UID }] });
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
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.selectShippingAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // const db = await dbc.dbConnection();
        const userEmail = req.decoded.email;
        let { _SA_UID, default_shipping_address } = req.body;
        default_shipping_address = default_shipping_address === true ? false : true;
        const user = yield User.findOne({ email: userEmail });
        if (!user) {
            return res.status(503).send({ success: false, statusCode: 503, error: 'User not found !!!' });
        }
        const shippingAddress = ((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) || [];
        if (shippingAddress && shippingAddress.length > 0) {
            const result = yield User.updateOne({ email: userEmail }, {
                $set: {
                    "buyer.shippingAddress.$[j].default_shipping_address": false,
                    "buyer.shippingAddress.$[i].default_shipping_address": default_shipping_address,
                },
            }, {
                arrayFilters: [{ "j._SA_UID": { $ne: _SA_UID } }, { "i._SA_UID": _SA_UID }],
                multi: true,
            });
            if (!result) {
                return res.status(400).send({
                    success: false,
                    statusCode: 400,
                    error: "Failed to select the address",
                });
            }
            return res.status(200).send({ success: true, statusCode: 200, message: "Shipping address Saved." });
        }
    }
    catch (error) {
        res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.deleteShippingAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const db = await dbc.dbConnection();
        const email = req.decoded.email;
        const _SA_UID = parseInt(req.params._SA_UID);
        const result = yield User.updateOne({ email: email }, { $pull: { "buyer.shippingAddress": { _SA_UID } } });
        if (result)
            return res.send(result);
    }
    catch (error) {
        res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
