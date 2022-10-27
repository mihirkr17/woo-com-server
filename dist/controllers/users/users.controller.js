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
var jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const userModel = require("../../model/UserModel");
const User = require("../../model/user.model");
const setToken = require("../../utils/setToken");
const generateVerifyToken = require("../../utils/generateVerifyToken");
const { comparePassword } = require("../../utils/comparePassword");
const emailValidator = require("../../helpers/emailValidator");
/**
 * controller --> user login controller
 * request method --> POST
 * required --> BODY
 */
module.exports.userLoginController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const verify_token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]) || undefined;
        const { username, password, authProvider } = req.body;
        let token;
        let userData;
        let credentials;
        const cookieObject = {
            sameSite: "none",
            secure: true,
            maxAge: 57600000,
            httpOnly: true,
        };
        if (typeof authProvider === 'undefined' || !authProvider) {
            credentials = 'system';
        }
        else {
            credentials = authProvider;
        }
        const existUser = yield User.findOne({
            $and: [
                { $or: [{ username }, { email: username }] },
                { authProvider: credentials }
            ]
        });
        /// third party login system like --> Google
        if (authProvider === 'thirdParty') {
            if (!existUser || typeof existUser === 'undefined') {
                const user = new User({ email: username, username, authProvider, accountStatus: 'active' });
                userData = yield user.save();
            }
            else {
                userData = existUser;
            }
            token = setToken(userData);
        }
        // system login
        else {
            if (!existUser) {
                return res.status(400).send({ success: false, statusCode: 400, error: 'User not found !!!' });
            }
            let comparedPassword = yield comparePassword(password, existUser === null || existUser === void 0 ? void 0 : existUser.password);
            if (!comparedPassword) {
                return res.status(400).send({ success: false, statusCode: 400, error: "Password didn't match !!!" });
            }
            if (existUser.verifyToken && !verify_token) {
                res.cookie("verifyToken", existUser.verifyToken, { maxAge: 3600000, httpOnly: false });
                return res.send({ success: true, statusCode: 200, message: 'verifyTokenOnCookie' });
            }
            // next condition
            if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {
                if ((existUser === null || existUser === void 0 ? void 0 : existUser.verifyToken) !== verify_token) {
                    return res.status(400).send({ success: false, statusCode: 400, error: 'Required valid token !!!' });
                }
                yield User.updateOne({ $or: [{ username }, { email: username }] }, { $unset: { verifyToken: 1 }, $set: { accountStatus: 'active' } });
                res.clearCookie('verifyToken');
            }
            token = setToken(existUser);
        }
        if (token) {
            res.cookie("token", token, cookieObject);
            res.cookie("is_logged", existUser === null || existUser === void 0 ? void 0 : existUser._id, { httpOnly: false, maxAge: 57600000 });
            return res.status(200).send({ message: "isLogin", statusCode: 200, success: true });
        }
    }
    catch (error) {
        return res.status(400).send({ success: false, statusCode: 400, error: error.message });
    }
});
/**
 * controller --> user registration controller
 * request method --> POST
 * required --> BODY
 */
module.exports.userRegisterController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        if (!req.body) {
            return res.status(400).send({ success: false, statusCode: 400, error: "Information not found !!!" });
        }
        if (username.length <= 3 && username.length >= 9) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'Username length must between 4 to 8 characters !!!' });
        }
        if (email.length <= 0) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'Email address required !!!' });
        }
        if (!emailValidator(email)) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'Invalid email address !!!' });
        }
        if (password.length <= 0) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'Password required !!!' });
        }
        if (password.length <= 4) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'Password must be greater than 5 characters !!!' });
        }
        let existUser = yield User.findOne({ $or: [{ username }, { email }] });
        if (existUser) {
            return res.status(400).send({ success: false, statusCode: 400, error: "User already exists ! Please try another username or email address." });
        }
        let body = req.body;
        body['verifyToken'] = generateVerifyToken();
        let user = new User(body);
        const result = yield user.save();
        if (!result) {
            return res.status(500).send({ success: false, statusCode: 500, error: "Internal error!" });
        }
        res.cookie("verifyToken", result === null || result === void 0 ? void 0 : result.verifyToken, { maxAge: 3600000, httpOnly: false });
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Registration success. Please verify your account.",
            data: { username: result === null || result === void 0 ? void 0 : result.username, verifyToken: result === null || result === void 0 ? void 0 : result.verifyToken, email: result === null || result === void 0 ? void 0 : result.email }
        });
    }
    catch (error) {
        return res.status(400).send({ success: false, statusCode: 400, error: error.message });
    }
});
module.exports.userRegisterVerify = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const verify_token = ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1]) || undefined;
        const existUser = yield User.findOne({ verifyToken: verify_token });
        if (!existUser) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'User not found !!!' });
        }
        if (existUser.verifyToken && !verify_token) {
            res.cookie("verifyToken", existUser.verifyToken, { maxAge: 3600000, httpOnly: false });
            return res.send({ success: true, statusCode: 200, message: 'verifyTokenOnCookie' });
        }
        // next condition
        if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {
            if ((existUser === null || existUser === void 0 ? void 0 : existUser.verifyToken) !== verify_token) {
                return res.status(400).send({ success: false, statusCode: 400, error: 'Invalid token !!!' });
            }
            yield User.updateOne({ verifyToken: verify_token }, {
                $unset: { verifyToken: 1 },
                $set: { accountStatus: 'active' }
            });
            res.clearCookie('verifyToken');
            return res.status(200).send({ success: true, statusCode: 200, message: "User verified.", data: { username: existUser === null || existUser === void 0 ? void 0 : existUser.username } });
        }
    }
    catch (error) {
    }
});
/**
 * controller --> fetch authenticate user information
 * request method --> GET
 * required --> NONE
 */
module.exports.fetchAuthUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        const role = req.decoded.role;
        let result;
        const db = yield dbConnection();
        result = yield User.findOne({ $and: [{ email: authEmail }, { role: role }, { accountStatus: 'active' }] });
        if (!result || typeof result !== "object") {
            return res.status(404).send({ success: false, statusCode: 404, error: "User not found!" });
        }
        result.password = undefined;
        result.authProvider = undefined;
        result.createdAt = undefined;
        if ((result === null || result === void 0 ? void 0 : result.role) === 'user') {
            const cartItems = yield db.collection('shoppingCarts').countDocuments({ customerEmail: authEmail });
            result['shoppingCartItems'] = cartItems || 0;
        }
        return res
            .status(200)
            .send({ success: true, statusCode: 200, message: 'Welcome ' + (result === null || result === void 0 ? void 0 : result.username), data: result });
    }
    catch (error) {
        next(error);
    }
});
module.exports.signOutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("token");
        res.clearCookie('is_logged');
        res.status(200).send({ success: true, statusCode: 200, message: "Sign out successfully" });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.updateProfileData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const email = req.decoded.email;
        const result = yield db
            .collection("users")
            .updateOne({ email: email }, { $set: req.body }, { upsert: true });
        res.status(200).send(result);
    }
    catch (error) {
        res.status(500).send({ error: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.makeAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const userId = req.params.userId;
        if (!ObjectId.isValid(userId)) {
            return res
                .status(400)
                .send({ success: false, error: "User ID not valid" });
        }
        const result = yield db
            .collection("users")
            .updateOne({ _id: ObjectId(userId) }, { $set: { role: "admin" } }, { upsert: true });
        return result
            ? res.status(200).send({ success: true, message: "Permission granted" })
            : res.status(500).send({ success: false, error: "Failed" });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.demoteToUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const userId = req.params.userId;
        if (!ObjectId.isValid(userId)) {
            return res.status(400).send({ error: "User Id is not valid" });
        }
        res
            .status(200)
            .send(yield db
            .collection("users")
            .updateOne({ _id: ObjectId(userId) }, { $set: { role: "user" } }, { upsert: true }));
    }
    catch (error) {
        next(error);
    }
});
module.exports.manageUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const uType = req.query.uTyp;
        res
            .status(200)
            .send(yield db.collection("users").find({ role: uType }).toArray());
    }
    catch (error) {
        next(error);
    }
});
module.exports.makeSellerRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        const authRole = req.decoded.role;
        let user = yield User.findOne({ $and: [{ email: authEmail }, { role: 'user' }] });
        if (!user) {
            return res.status(404).send({ success: false, statusCode: 404, error: 'User not found' });
        }
        if ((user === null || user === void 0 ? void 0 : user.isSeller) === 'pending') {
            return res.status(200).send({
                success: false,
                statusCode: 200,
                error: 'You already send a seller request. We are working for your request, and it will take sometime to verify'
            });
        }
        let body = req.body;
        let businessInfo = {
            taxID: body === null || body === void 0 ? void 0 : body.taxID,
            stateTaxID: body === null || body === void 0 ? void 0 : body.stateTaxID,
            creditCard: body === null || body === void 0 ? void 0 : body.creditCard,
        };
        let sellerInfo = {
            fName: body === null || body === void 0 ? void 0 : body.fName,
            lName: body === null || body === void 0 ? void 0 : body.lName,
            dateOfBirth: body === null || body === void 0 ? void 0 : body.dateOfBirth,
            phone: body === null || body === void 0 ? void 0 : body.phone,
            address: {
                street: body === null || body === void 0 ? void 0 : body.street,
                thana: body === null || body === void 0 ? void 0 : body.thana,
                district: body === null || body === void 0 ? void 0 : body.district,
                state: body === null || body === void 0 ? void 0 : body.state,
                country: body === null || body === void 0 ? void 0 : body.country,
                pinCode: body === null || body === void 0 ? void 0 : body.pinCode
            }
        };
        let inventoryInfo = {
            earn: 0,
            totalSell: 0,
            totalProducts: 0,
            storeName: body === null || body === void 0 ? void 0 : body.storeName,
            storeCategory: body === null || body === void 0 ? void 0 : body.categories,
            storeAddress: {
                street: body === null || body === void 0 ? void 0 : body.street,
                thana: body === null || body === void 0 ? void 0 : body.thana,
                district: body === null || body === void 0 ? void 0 : body.district,
                state: body === null || body === void 0 ? void 0 : body.state,
                country: body === null || body === void 0 ? void 0 : body.country,
                pinCode: body === null || body === void 0 ? void 0 : body.pinCode
            }
        };
        let isUpdate = yield User.updateOne({ $and: [{ email: authEmail }, { role: authRole }] }, { $set: { businessInfo, sellerInfo, inventoryInfo, isSeller: 'pending' } }, { new: true });
        if (isUpdate) {
            return res
                .status(200)
                .send({ success: true, statusCode: 200, message: "Thanks for sending a seller request. We are working for your request" });
        }
    }
    catch (error) {
        res.status(400).send({ success: false, statusCode: 400, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
// Permit the seller request
module.exports.permitSellerRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const userId = (_c = req.headers.authorization) === null || _c === void 0 ? void 0 : _c.split(',')[0];
        const userEmail = (_d = req.headers.authorization) === null || _d === void 0 ? void 0 : _d.split(',')[1];
        const user = yield User.findOne({ $and: [{ email: userEmail }, { _id: userId }, { isSeller: 'pending' }] });
        if (!user) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'Sorry! request user not found.' });
        }
        let result = yield User.updateOne({ email: userEmail }, {
            $set: { role: "seller", isSeller: 'fulfilled', becomeSellerAt: new Date() },
            $unset: { shoppingCartItems: 1, shippingAddress: 1 }
        }, { new: true });
        (result === null || result === void 0 ? void 0 : result.acknowledged)
            ? res.status(200).send({ success: true, statusCode: 200, message: "Request Success" })
            : res.status(400).send({ success: false, statusCode: 400, error: "Bad Request" });
    }
    catch (error) {
        res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
/**
 * controller --> fetch seller request in admin dashboard
 * request method --> GET
 * required --> NONE
 */
module.exports.checkSellerRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let sellers = yield User.find({ isSeller: 'pending' });
        sellers.forEach((user) => {
            user === null || user === void 0 ? true : delete user.password;
        });
        return res.status(200).send({ success: true, statusCode: 200, data: sellers });
    }
    catch (error) {
        res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
