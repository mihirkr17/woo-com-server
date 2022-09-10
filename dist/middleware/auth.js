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
var jwt = require("jsonwebtoken");
const { dbConnection } = require("../utils/db");
const verifyJWT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.token;
    if (!token || typeof token === "undefined") {
        return res
            .status(403)
            .send({ success: false, statusCode: 403, error: "Login Expired !" });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            res.clearCookie("token");
            return res.status(401).send({
                success: false,
                statusCode: 401,
                error: err.message,
            });
        }
        req.decoded = decoded;
        next();
    });
});
// // verify owner
const checkingOwnerOrAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbConnection();
    const authEmail = req.decoded.email;
    const findAuthInDB = yield db.collection("users").findOne({
        email: authEmail && authEmail,
    });
    if (findAuthInDB.role !== "owner" || findAuthInDB.role !== "admin") {
        return res.status(400).send({
            success: false,
            statusCode: 400,
            error: "You are not a owner or admin, So you are not authorized for process this.",
        });
    }
    next();
});
// verify seller
const checkingSeller = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbConnection();
    const authEmail = req.decoded.email;
    const findAuthInDB = yield db.collection("users").findOne({
        email: authEmail && authEmail,
    });
    if (findAuthInDB.role !== "seller") {
        return res.status(400).send({
            success: false,
            statusCode: 400,
            error: "You are not a seller, So you are not authorized for process this.",
        });
    }
    next();
});
// verify seller
const checkingUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbConnection();
    const authEmail = req.decoded.email;
    const findAuthInDB = yield db.collection("users").findOne({
        email: authEmail && authEmail,
    });
    if (findAuthInDB.role !== "user") {
        return res.status(400).send({
            success: false,
            statusCode: 400,
            error: "You are not a user, So you are not authorized for process this.",
        });
    }
    next();
});
module.exports = {
    verifyJWT,
    checkingOwnerOrAdmin,
    checkingSeller,
    checkingUser,
};
