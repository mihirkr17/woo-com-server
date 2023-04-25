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
const { ObjectId } = require("mongodb");
const User = require("../../model/user.model");
const apiResponse = require("../../errors/apiResponse");
/**
 * @apiController --> Update Profile Data Controller
 * @apiMethod --> PUT
 * @apiRequired --> client email in header
 */
module.exports.updateProfileDataController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.decoded.email;
        const { userEmail } = req.query;
        const body = req.body;
        if (userEmail !== email) {
            throw new apiResponse.Api400Error("Invalid email address !");
        }
        if (!body || typeof body === "undefined") {
            throw new apiResponse.Api400Error("Required body with request !");
        }
        const { fullName, dob, gender } = body;
        if (!fullName || typeof fullName !== "string")
            throw new apiResponse.Api400Error("Required full name !");
        if (!dob || typeof dob !== "string")
            throw new apiResponse.Api400Error("Required date of birth !");
        if (!gender || typeof gender !== "string")
            throw new apiResponse.Api400Error("Required gender !");
        let profileModel = {
            fullName,
            dob,
            gender,
        };
        const result = yield User.findOneAndUpdate({ email: email }, { $set: profileModel }, { upsert: true });
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Profile updated." });
        }
    }
    catch (error) {
        next(error);
    }
});
/**
 * @apiController --> Make Admin Controller
 * @apiMethod --> PUT
 * @apiRequired --> userId in params
 */
module.exports.makeAdminController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        if (!ObjectId.isValid(userId)) {
            return res
                .status(400)
                .send({ success: false, error: "User ID not valid" });
        }
        const result = yield User.updateOne({ _id: ObjectId(userId) }, { $set: { role: "ADMIN" } }, { new: true });
        return result
            ? res.status(200).send({ success: true, message: "Permission granted" })
            : res.status(500).send({ success: false, error: "Failed" });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @apiController --> Demote admin to user Controller
 * @apiMethod --> PUT
 * @apiRequired --> userId in params
 */
module.exports.demoteToUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        if (!ObjectId.isValid(userId)) {
            return res.status(400).send({ error: "User Id is not valid" });
        }
        res
            .status(200)
            .send(yield User.updateOne({ _id: ObjectId(userId) }, { $set: { role: "BUYER" } }, { new: true }));
    }
    catch (error) {
        next(error);
    }
});
module.exports.manageUsersController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uType = req.query.uTyp;
        res.status(200).send(yield User.find({ role: uType }));
    }
    catch (error) {
        next(error);
    }
});
/**
* controller --> fetch seller request in admin dashboard
* request method --> GET
* required --> NONE
*/
module.exports.checkSellerRequestController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let sellers = yield User.find({ isSeller: 'pending' });
        sellers.forEach((user) => {
            user === null || user === void 0 ? true : delete user.password;
        });
        return res.status(200).send({ success: true, statusCode: 200, data: sellers });
    }
    catch (error) {
        next(error);
    }
});
