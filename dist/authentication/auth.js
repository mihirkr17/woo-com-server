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
const { dbh } = require("../database/db");
const verifyJWT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // const authHeader = req.headers.authorization;
    // if (!authHeader) return res.status(403).send({ message: "Forbidden" });
    const token = req.cookies.token;
    // const token = authHeader.split(" ")[1];
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
            if (err) {
                res.clearCookie("token");
                return res.status(401).send({
                    message: err.message,
                });
            }
            req.decoded = decoded;
            next();
        });
    }
    else {
        return res.status(403).send({ message: "Forbidden" });
    }
});
// // verify owner
const checkingOwnerOrAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield dbh.connect();
    const userCollection = dbh.db("ecommerce-db").collection("users");
    const authEmail = req.decoded.email;
    const findAuthInDB = yield userCollection.findOne({
        email: authEmail && authEmail,
    });
    if (findAuthInDB.role === "owner" || findAuthInDB.role === "admin") {
        next();
    }
    else {
        res.status(403).send({ message: "Forbidden" });
    }
});
// verify seller
const checkingSeller = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield dbh.connect();
    const userCollection = dbh.db("ecommerce-db").collection("users");
    const authEmail = req.decoded.email;
    const findAuthInDB = yield userCollection.findOne({
        email: authEmail && authEmail,
    });
    if (findAuthInDB.role === "seller") {
        next();
    }
    else {
        res.status(403).send({ message: "Forbidden" });
    }
});
// verify seller
const checkingUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield dbh.connect();
    const userCollection = dbh.db("ecommerce-db").collection("users");
    const authEmail = req.decoded.email;
    const findAuthInDB = yield userCollection.findOne({
        email: authEmail && authEmail,
    });
    if (findAuthInDB.role === "user") {
        next();
    }
    else {
        res.status(403).send({ message: "Forbidden" });
    }
});
module.exports = { verifyJWT, checkingOwnerOrAdmin, checkingSeller, checkingUser };
