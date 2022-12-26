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
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
/**
 * @controller --> Delete cart items by product ID
 * @request_method --> DELETE
 * @required --> productId:req.headers.authorization & cartTypes:req.params
 */
module.exports.deleteCartItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = req.headers.authorization;
        const authEmail = req.decoded.email;
        const cart_types = req.params.cartTypes;
        let updateDocuments;
        const db = yield dbConnection();
        if (!ObjectId.isValid(productId) || !productId) {
            return res.status(500).send({ success: false, statusCode: 500, message: "headers missing!!!" });
        }
        if (cart_types === "toCart") {
            updateDocuments = yield db.collection('shoppingCarts').deleteOne({ $and: [{ customerEmail: authEmail }, { productId }] });
        }
        if (updateDocuments) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Item removed successfully from your cart." });
        }
        return res.status(500).send({ success: false, statusCode: 500, message: "Sorry! failed to remove!!!" });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.deleteCartAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const email = req.decoded.email;
        const addressId = parseInt(req.params.addressId);
        const result = yield db
            .collection("users")
            .updateOne({ email: email }, { $pull: { shippingAddress: { addressId } } });
        if (result)
            return res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
