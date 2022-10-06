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
module.exports.fetchAuthUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const authEmail = req.headers.authorization || "";
        if (!authEmail || typeof authEmail === "undefined") {
            return res
                .status(400)
                .send({ success: false, error: "Authorization header is missing!" });
        }
        const result = yield db.collection("users").findOne({ email: authEmail });
        if (!result || typeof result !== "object") {
            return res.status(404).send({ success: false, error: "User not found!" });
        }
        yield db
            .collection("users")
            .updateOne({ email: authEmail }, { $pull: { myCartProduct: { stock: "out" } } });
        return res
            .status(200)
            .send({ success: true, statusCode: 200, data: result });
    }
    catch (error) {
        next(error);
    }
});
module.exports.signUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const authEmail = req.headers.authorization || "";
        if (!authEmail || typeof authEmail !== "string") {
            return res
                .status(400)
                .send({ success: false, error: "Authorization header is missing!" });
        }
        const cookieObject = {
            sameSite: "none",
            secure: true,
            maxAge: 7200000,
            httpOnly: true,
        };
        const token = jwt.sign({ email: authEmail }, process.env.ACCESS_TOKEN, {
            algorithm: "HS256",
            expiresIn: "1h",
        });
        const setToken = () => {
            return res.cookie("token", token, cookieObject)
                ? res
                    .status(200)
                    .send({ message: "Login success", statusCode: 200, success: true })
                : res.status(400).send({ error: "Bad request", success: false });
        };
        const existsUser = yield db
            .collection("users")
            .findOne({ email: authEmail });
        if (existsUser && typeof existsUser === "object") {
            return setToken();
        }
        // user model
        const model = new userModel(req.body, authEmail);
        const errs = model.errorReports();
        if (errs) {
            return res.status(400).send({ success: false, error: errs });
        }
        const newUser = yield db.collection("users").insertOne(model);
        if (newUser === null || newUser === void 0 ? void 0 : newUser.insertedId)
            return setToken();
    }
    catch (error) {
        next(error);
    }
});
module.exports.signOutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("token");
        res.status(200).send({ message: "Sign out successfully" });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.switchRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const db = yield dbConnection();
        const userEmail = req.decoded.email;
        const userID = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        const userRole = req.params.role;
        let roleModel;
        if (!userID) {
            return res
                .status(400)
                .send({ message: "Bad request! headers is missing" });
        }
        if (userRole === "user") {
            roleModel = { role: "user" };
        }
        if (userRole === "seller") {
            roleModel = { role: "seller" };
        }
        if (userID && userEmail) {
            const result = yield db
                .collection("users")
                .updateOne({ _id: ObjectId(userID), email: userEmail }, { $set: roleModel }, { upsert: true });
            if (result)
                return res.status(200).send(result);
        }
    }
    catch (error) {
        res.status(500).send({ error: error === null || error === void 0 ? void 0 : error.message });
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
        const db = yield dbConnection();
        const userEmail = req.params.userEmail;
        let body = req.body;
        let existSellerName;
        if (body === null || body === void 0 ? void 0 : body.seller) {
            existSellerName = yield db.collection("users").findOne({
                seller: body === null || body === void 0 ? void 0 : body.seller,
            });
        }
        if (existSellerName) {
            return res
                .status(200)
                .send({ message: "Seller name exists ! try to another" });
        }
        else {
            const result = yield db.collection("users").updateOne({ email: userEmail }, {
                $set: body,
            }, { upsert: true });
            res.status(200).send({ result, message: "success" });
        }
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.permitSellerRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const userId = req.params.userId;
        const result = yield db.collection("users").updateOne({ _id: ObjectId(userId) }, {
            $set: { role: "seller", seller_request: "ok", isSeller: true },
        }, { upsert: true });
        (result === null || result === void 0 ? void 0 : result.acknowledged)
            ? res.status(200).send({ message: "Request Success" })
            : res.status(400).send({ message: "Bad Request" });
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.checkSellerRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        res
            .status(200)
            .send(yield db
            .collection("users")
            .find({ seller_request: "pending" })
            .toArray());
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
