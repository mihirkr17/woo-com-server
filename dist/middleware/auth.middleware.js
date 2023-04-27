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
const apiResponse = require("../errors/apiResponse");
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns true
 * @middleware Verifying valid json web token
 */
const verifyJWT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = req.cookies.token; // finding token in http only cookies.
        const log_tok = ((_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1]) || req.cookies.log_tok;
        // if token not present in cookies then return 403 status code and terminate the request here....
        if (!token || typeof token === "undefined") {
            throw new apiResponse.Api401Error('Token not found');
        }
        if (log_tok !== token) {
            res.clearCookie("token");
            throw new apiResponse.Api401Error('Token is not valid !');
        }
        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
            // verifying the token with jwt verify method and if token broken then 401 status code will send and terminate the request
            if (err) {
                res.clearCookie("token");
                throw new apiResponse.Api401Error(err === null || err === void 0 ? void 0 : err.message);
            }
            // if success then return email throw req.decoded
            req.decoded = decoded;
            next();
        });
    }
    catch (error) {
        next(error);
    }
});
// // verify owner
const isRoleOwnerOrAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authRole = req.decoded.role;
        if (authRole === "OWNER" || authRole === "ADMIN") {
            next();
        }
        else {
            throw new apiResponse.Api403Error("Forbidden access !");
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
            throw new apiResponse.Api403Error("Forbidden access !");
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
            throw new apiResponse.Api403Error("Forbidden access !");
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
            throw new apiResponse.Api403Error("Forbidden access !");
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
            throw new apiResponse.Api403Error("Forbidden access !");
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
