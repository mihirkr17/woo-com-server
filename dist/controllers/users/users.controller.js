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
const { dbh } = require("../../utils/db");
var jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
module.exports.fetchAuthUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const userCollection = dbh.db("Users").collection("user");
        const authEmail = req.headers.authorization || "";
        if (authEmail) {
            yield userCollection.updateOne({ email: authEmail }, { $pull: { myCartProduct: { stock: "out" } } });
            const result = yield userCollection.findOne({ email: authEmail });
            return result
                ? res.status(200).send({ success: true, statusCode: 200, data: result })
                : res.status(500).send({ error: "Internal Server Error!" });
        }
        else {
            return res.status(400).send({ error: "Bad request" });
        }
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
module.exports.signUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield dbh.connect();
        const userCollection = dbh.db("Users").collection("user");
        const authEmail = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        const { name } = req.body;
        if (!authEmail) {
            return res.status(400).send({ message: "Bad request" });
        }
        const cookieObject = {
            // sameSite: "none",
            // secure: true,
            maxAge: 9000000,
            httpOnly: true,
        };
        if (authEmail) {
            const token = jwt.sign({ email: authEmail }, process.env.ACCESS_TOKEN, {
                algorithm: "HS256",
                expiresIn: "1h",
            });
            const existsUser = yield userCollection.findOne({ email: authEmail });
            if (existsUser) {
                res.cookie("token", token, cookieObject);
                return res.status(200).send({ message: "Login success" });
            }
            else {
                yield userCollection.updateOne({ email: authEmail }, { $set: { email: authEmail, displayName: name, role: "user" } }, { upsert: true });
                res.cookie("token", token, cookieObject);
                return res.status(200).send({ message: "Login success" });
            }
        }
    }
    catch (error) {
        res.status(500).send({ message: error.message });
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
    var _b;
    try {
        yield dbh.connect();
        const userCollection = dbh.db("Users").collection("user");
        const userEmail = req.decoded.email;
        const userID = (_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1];
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
            const result = yield userCollection.updateOne({ _id: ObjectId(userID), email: userEmail }, { $set: roleModel }, { upsert: true });
            if (result)
                return res.status(200).send(result);
        }
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.updateProfileData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const userCollection = dbh.db("Users").collection("user");
        const email = req.decoded.email;
        const result = yield userCollection.updateOne({ email: email }, { $set: req.body }, { upsert: true });
        res.status(200).send(result);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.makeAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const userCollection = dbh.db("Users").collection("user");
        const userId = req.params.userId;
        res
            .status(200)
            .send(yield userCollection.updateOne({ _id: ObjectId(userId) }, { $set: { role: "admin" } }, { upsert: true }));
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.demoteToUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const userCollection = dbh.db("Users").collection("user");
        const userId = req.params.userId;
        res
            .status(200)
            .send(yield userCollection.updateOne({ _id: ObjectId(userId) }, { $set: { role: "user" } }, { upsert: true }));
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.manageUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const userCollection = dbh.db("Users").collection("user");
        const uType = req.query.uTyp;
        res.status(200).send(yield userCollection.find({ role: uType }).toArray());
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
module.exports.makeSellerRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbh.connect();
        const userCollection = dbh.db("Users").collection("user");
        const userEmail = req.params.userEmail;
        let body = req.body;
        let existSellerName;
        if (body === null || body === void 0 ? void 0 : body.seller) {
            existSellerName = yield userCollection.findOne({
                seller: body === null || body === void 0 ? void 0 : body.seller,
            });
        }
        if (existSellerName) {
            return res
                .status(200)
                .send({ message: "Seller name exists ! try to another" });
        }
        else {
            const result = yield userCollection.updateOne({ email: userEmail }, {
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
        yield dbh.connect();
        const userCollection = dbh.db("Users").collection("user");
        const userId = req.params.userId;
        const result = yield userCollection.updateOne({ _id: ObjectId(userId) }, {
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
        yield dbh.connect();
        const userCollection = dbh.db("Users").collection("user");
        res
            .status(200)
            .send(yield userCollection.find({ seller_request: "pending" }).toArray());
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
