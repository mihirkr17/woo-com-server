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
const verifyAuthUserByJWT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.token; // finding token in http only cookies.
    // if token not present in cookies then return 403 status code and terminate the request here....
    if (!token || typeof token === "undefined") {
        res.clearCookie('is_logged');
        return res.status(204).send();
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        // verifying the token with jwt verify method and if token broken then 401 status code will send and terminate the request
        if (err) {
            res.clearCookie("token");
            res.clearCookie('is_logged');
            return res.status(401).send({
                success: false,
                statusCode: 401,
                error: err.message,
            });
        }
        // if success then return email throw req.decoded
        req.decoded = decoded;
        next();
    });
});
const verifyJWT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.token; // finding token in http only cookies.
    // if token not present in cookies then return 403 status code and terminate the request here....
    if (!token || typeof token === "undefined") {
        res.clearCookie('is_logged');
        return res.status(401).send({ success: false, statusCode: 401, error: 'Token not found' });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        // verifying the token with jwt verify method and if token broken then 401 status code will send and terminate the request
        if (err) {
            res.clearCookie("token");
            res.clearCookie('is_logged');
            return res.status(401).send({
                success: false,
                statusCode: 401,
                error: err.message,
            });
        }
        // if success then return email throw req.decoded
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
    if (findAuthInDB.role === "OWNER" || findAuthInDB.role === "ADMIN") {
        next();
    }
    else {
        return res.status(503).send({
            success: false,
            statusCode: 503,
            error: "You are not a owner or admin, So you are not authorized for process this.",
        });
    }
});
// verify seller
const checkingSeller = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbConnection();
    const authEmail = req.decoded.email;
    const user = yield db.collection('users').findOne({ $and: [{ email: authEmail }, { role: 'SELLER' }] });
    if (!user) {
        return res.status(503).send({
            success: false,
            statusCode: 503,
            error: "You are not a seller, So you are not authorized for process this.",
        });
    }
    req.decoded = { _id: user._id, email: user.email, username: user.username, role: user.role };
    next();
});
// verify seller
const checkingUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbConnection();
    const authEmail = req.decoded.email;
    const findAuthInDB = yield db.collection("users").findOne({
        email: authEmail && authEmail,
    });
    if (findAuthInDB.role !== "BUYER") {
        return res.status(400).send({
            success: false,
            statusCode: 400,
            error: "You are not a user, So you are not authorized for process this.",
        });
    }
    next();
});
// admin authorization
const isAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const authEmail = req.decoded.email;
        const authRole = req.decoded.role;
        if (authRole !== 'ADMIN') {
            return res.status(503).send({ success: false, statusCode: 503, error: "Service is unavailable !" });
        }
        const findAdmin = yield db.collection('users').findOne({ $and: [{ email: authEmail }, { role: 'ADMIN' }] });
        if (!findAdmin) {
            return res.status(503).send({ success: false, statusCode: 503, error: "Service is unavailable !" });
        }
        next();
    }
    catch (error) {
        return res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports = {
    verifyJWT,
    checkingOwnerOrAdmin,
    checkingSeller,
    checkingUser,
    verifyAuthUserByJWT,
    isAdmin
};
