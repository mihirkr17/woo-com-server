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
const apiResponse = require("../res/response");
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
        const token = ((_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1]) || req.cookies.log_tok;
        // if token not present in cookies then return 401 unauthorized errors...
        if (!token || typeof token === "undefined") {
            throw new apiResponse.Error401('Token not found');
        }
        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
            // verifying the token with jwt verify method and if token broken then 401 status code will send and terminate the request
            if (err) {
                res.clearCookie("token");
                throw new apiResponse.Error401(err === null || err === void 0 ? void 0 : err.message);
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
            throw new apiResponse.Error403("Forbidden access !");
        }
    }
    catch (error) {
        next(error);
    }
});
// verify seller
const isSupplier = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authRole = req.decoded.role;
        if (authRole === 'SUPPLIER') {
            next();
        }
        else {
            throw new apiResponse.Error403("Forbidden access !");
        }
    }
    catch (error) {
        next(error);
    }
});
// verify seller
const isCustomer = (req, res, next) => {
    const authRole = req.decoded.role;
    if (authRole === "CUSTOMER") {
        next();
    }
    else {
        throw new apiResponse.Error403("Forbidden access !");
    }
};
// admin authorization
const isAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authRole = req.decoded.role;
        if (authRole === 'ADMIN') {
            next();
        }
        else {
            throw new apiResponse.Error403("Forbidden access !");
        }
    }
    catch (error) {
        next(error);
    }
});
const isPermitForDashboard = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authRole = req.decoded.role;
        if (authRole === 'SUPPLIER' || authRole === 'ADMIN' || authRole === 'OWNER') {
            next();
        }
        else {
            throw new apiResponse.Error403("Forbidden access !");
        }
    }
    catch (error) {
        next(error);
    }
});
function verifyEmailByJWT(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const { token } = req.query; // getting from query
        // if token not present in cookies then return 401 unauthorized errors...
        if (!token || typeof token === "undefined") {
            throw new apiResponse.Error401('Required verification token !');
        }
        try {
            jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
                if (err)
                    return res.status(401).json({ success: false, statusCode: 401, message: "Invalid token !" });
                req.decoded = decoded;
                next();
            });
        }
        catch (error) {
            next(error);
        }
    });
}
module.exports = {
    verifyJWT,
    isRoleOwnerOrAdmin,
    isSupplier,
    isCustomer,
    isAdmin,
    isPermitForDashboard,
    verifyEmailByJWT
};
