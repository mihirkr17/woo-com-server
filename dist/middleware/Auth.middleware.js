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
const response = require("../errors/apiResponse");
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns true
 * @middleware Verifying valid json web token
 */
const verifyJWT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.token; // finding token in http only cookies.
    // if token not present in cookies then return 403 status code and terminate the request here....
    if (!token || typeof token === "undefined") {
        return res.status(401).send();
        // return res.status(401).send({ success: false, statusCode: 401, error: 'Token not found' });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        // verifying the token with jwt verify method and if token broken then 401 status code will send and terminate the request
        if (err) {
            res.clearCookie("token");
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
const isRoleOwnerOrAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authRole = req.decoded.role;
        if (authRole === "OWNER" || authRole === "ADMIN") {
            next();
        }
        else {
            return res.status(401).send({ success: false, statusCode: 401, error: "Unauthorized access!" });
        }
    }
    catch (error) {
        next(error);
    }
});
// verify seller
const isRoleSeller = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authRole = req.decoded.role;
        if (authRole === 'SELLER') {
            next();
        }
        else {
            return res.status(401).send({ success: false, statusCode: 401, error: "Unauthorized access!" });
        }
    }
    catch (error) {
        next(error);
    }
});
// verify seller
const isRoleBuyer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authRole = req.decoded.role;
        if (authRole === "BUYER") {
            next();
        }
        else {
            return res.status(400).send({
                success: false,
                statusCode: 400,
                error: "You are not a user, So you are not authorized for process this.",
            });
        }
    }
    catch (error) {
        next(error);
    }
});
// admin authorization
const isRoleAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authRole = req.decoded.role;
        if (authRole === 'ADMIN') {
            next();
        }
        else {
            return res.status(401).send({ success: false, statusCode: 401, error: "Unauthorized access!" });
        }
    }
    catch (error) {
        next(error);
    }
});
const isPermitForDashboard = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authRole = req.decoded.role;
        if (authRole === 'SELLER' || authRole === 'ADMIN' || authRole === 'OWNER') {
            next();
        }
        else {
            return res.status(401).send({ success: false, statusCode: 401, error: "Unauthorized access!" });
        }
    }
    catch (error) {
        next(error);
    }
});
module.exports = {
    verifyJWT,
    isRoleOwnerOrAdmin,
    isRoleSeller,
    isRoleBuyer,
    isRoleAdmin,
    isPermitForDashboard
};
