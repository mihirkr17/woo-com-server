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
module.exports.addToWishlistHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const userEmail = req.params.email;
        const verifiedEmail = req.decoded.email;
        const body = req.body;
        if (userEmail !== verifiedEmail) {
            return res.status(403).send({ message: "Forbidden" });
        }
        const existsProduct = yield db.collection("users").findOne({
            email: userEmail,
            "wishlist._id": body === null || body === void 0 ? void 0 : body._id,
        }, {
            "wishlist.$": 1,
        });
        if (existsProduct) {
            return res
                .status(200)
                .send({ message: "Product Has Already In Your Wishlist" });
        }
        else {
            const up = {
                $push: { wishlist: body },
            };
            const wishlistRes = yield db
                .collection("users")
                .updateOne({ email: userEmail }, up, { upsert: true });
            res.status(200).send({
                data: wishlistRes,
                message: "Product Added To Your wishlist",
            });
        }
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.removeFromWishlistHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const productId = req.params.productId;
        const userEmail = req.decoded.email;
        const result = yield db
            .collection("users")
            .updateOne({ email: userEmail }, { $pull: { wishlist: { _id: productId } } });
        if (result) {
            return res
                .status(200)
                .send({ message: "Product removed from your wishlist" });
        }
        else {
            return res.status(501).send({ message: "Service unavailable" });
        }
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
