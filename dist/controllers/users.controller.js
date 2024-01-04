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
const User = require("../model/CUSTOMER_TBL");
const Customer = require("../model/CUSTOMER_TBL");
const { ObjectId } = require("mongodb");
const NCache = require("../utils/NodeCache");
const { Error400, Error404 } = require("../res/response");
const smtpSender = require("../services/email.service");
const { verify_email_html_template, send_six_digit_otp_template, } = require("../templates/email.template");
const { generateSixDigitNumber, generateJwtToken, generateUserDataToken, generateVerificationToken, } = require("../utils/generator");
const { validEmail, validPassword, validDigit, validBDPhoneNumber, } = require("../utils/validator");
/**
 * [async description]
 *
 * @param   {Request}       req   [req description]
 * @param   {Response}      res   [res description]
 * @param   {NextFunction}  next  [next description]
 *
 * @return  {[type]}              [return description]
 */
function loginSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email: inputEmail, password: inputPassword } = req.body;
            let user = yield User.findOne({ email: inputEmail });
            if (!user)
                throw new Error400(`User with ${inputEmail} not found!`);
            const { email, verified, accountStatus, fullName, devices } = user || {};
            const matchedPwd = yield user.comparePassword(inputPassword);
            if (!matchedPwd)
                throw new Error400("Password didn't matched !");
            if (!verified || accountStatus === "Inactive") {
                const verifyToken = generateVerificationToken({ email });
                const info = yield smtpSender({
                    to: email,
                    subject: "Verify email address",
                    html: verify_email_html_template(verifyToken, fullName, req === null || req === void 0 ? void 0 : req.appUri),
                });
                if (!(info === null || info === void 0 ? void 0 : info.response))
                    throw new Error("Internal error !");
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    data: {
                        returnEmail: email,
                        action: "ACCOUNT_VERIFY_REQUEST",
                    },
                    message: `Go to ${email} and confirm email for verification.`,
                });
            }
            const loginToken = generateJwtToken(user);
            const userDataToken = generateUserDataToken(user);
            if (!loginToken || !userDataToken)
                throw new Error("Login failed due to internal issue !");
            const newDevice = {
                userAgent: req.get("user-agent"),
                ipAddress: req.ip,
            };
            let filterDevice = (devices &&
                devices.filter((item) => (item === null || item === void 0 ? void 0 : item.ipAddress) !== (newDevice === null || newDevice === void 0 ? void 0 : newDevice.ipAddress))) ||
                [];
            user.devices = [...filterDevice, newDevice];
            yield user.save();
            // if all operation success then return the response
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Login success",
                data: {
                    action: "LOGIN",
                    u_data: userDataToken,
                    token: loginToken,
                    role: user === null || user === void 0 ? void 0 : user.role,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function registrationSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let body = req.body;
            const requiredRoles = ["buyer", "supplier", "admin"];
            const origin = req.headers.referer || req.headers.origin || req.headers.host;
            const headersRole = req.headers.role || "";
            let existUser = yield User.countDocuments({ email: body === null || body === void 0 ? void 0 : body.email });
            if (existUser >= 1)
                throw new Error400("User already exists, Please try another email address !");
            const verifyToken = generateVerificationToken({ email: body === null || body === void 0 ? void 0 : body.email });
            const emailResult = yield smtpSender({
                to: body === null || body === void 0 ? void 0 : body.email,
                subject: "Verify email address",
                html: verify_email_html_template(verifyToken, body === null || body === void 0 ? void 0 : body.fullName, req === null || req === void 0 ? void 0 : req.appUri),
            });
            if (!(emailResult === null || emailResult === void 0 ? void 0 : emailResult.response))
                throw new Error400("Verification code not send to your email !");
            if (headersRole === "buyer") {
                body["role"] = "CUSTOMER";
                body["idFor"] = "buy";
            }
            if (headersRole === "SUPPLIER") {
                body["role"] = "SUPPLIER";
                body["idFor"] = "sell";
            }
            if (headersRole === "admin") {
                body["role"] = "ADMIN";
                body["idFor"] = "administration";
            }
            const newUser = new User(body);
            yield newUser.save();
            if (headersRole === "buyer") {
                const newCustomer = new Customer({
                    userId: newUser === null || newUser === void 0 ? void 0 : newUser._id,
                });
                yield newCustomer.save();
            }
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: `Thanks for your information. Verification code send to ${body === null || body === void 0 ? void 0 : body.email}`,
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function accountVerifyByEmailSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req.decoded;
            let user = yield User.findOne({ email });
            if (!user)
                throw new Error400(`Sorry account with ${email} not found`);
            if (user.verified && user.accountStatus === "Active") {
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "Your account already verified.",
                    data: {},
                });
            }
            user.verified = true;
            user.accountStatus = "Active";
            yield user.save();
            return res.redirect(301, `http://localhost:3000/login?email=${email}`);
            //  return res.status(200).send({
            //    success: true,
            //    statusCode: 200,
            //    message: `Congrats! Account with ${email} verification complete.`,
            //    data: {
            //      returnEmail: email,
            //    },
            //  });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function sendOtpForForgotPwdChangeSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req.body;
            if (!email)
                throw new Error400("Required email from body !");
            const user = yield User.findOne({ email });
            if (!user)
                throw new Error404(`User with ${email} Not found`);
            const otp = generateSixDigitNumber();
            const info = yield smtpSender({
                to: email,
                subject: "Reset your WooKart Password",
                html: send_six_digit_otp_template(otp, user === null || user === void 0 ? void 0 : user.fullName),
            });
            if (!(info === null || info === void 0 ? void 0 : info.response))
                throw new Error("Sorry ! Something wrong in your email. please provide valid email address.");
            const otpExTime = new Date(Date.now() + 5 * 60 * 1000); // 5mins added with current time
            user.otp = otp;
            user.otpExTime = otpExTime;
            yield user.save();
            return res.status(200).json({
                success: true,
                statusCode: 200,
                message: "We have send otp to your email.",
                data: {
                    otpExTime: otpExTime.getTime(),
                    returnEmail: user === null || user === void 0 ? void 0 : user.email,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function checkOtpForForgotPwdChangeSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { otp, email } = req === null || req === void 0 ? void 0 : req.body;
            if (!otp)
                throw new Error400("Required otp in body !");
            if (otp.length <= 5 || (otp === null || otp === void 0 ? void 0 : otp.length) >= 7)
                throw new Error400("Otp must 6 digit!");
            if (!email)
                throw new Error400("Required email address in body !");
            const user = yield User.findOne({ email });
            if (!user)
                throw new Error404(`Sorry we can't find any user with this ${email}!`);
            if (!user.otp)
                throw new Error("Internal error !");
            if (user.otp !== otp)
                throw new Error400("Invalid otp !");
            const now = new Date().getTime();
            const otpExTime = new Date(otp === null || otp === void 0 ? void 0 : otp.otpExTime).getTime();
            if (now >= otpExTime) {
                throw new Error400("Otp expired !");
            }
            return res.status(200).json({
                success: true,
                statusCode: 200,
                message: "Redirecting...",
                data: {
                    redirectUri: `forgot-pwd?action=forgotpwdform`,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function setNewPwdForForgotPwdChangeSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            if (!email || !validEmail(email))
                throw new Error400("Required valid email address !");
            if (password.length < 5 || password.length > 8)
                throw new Error400("Password length should be 5 to 8 characters !");
            if (!validPassword(password) || typeof password !== "string")
                throw new Error400("Password should contains at least 1 digit, lowercase letter, special character !");
            const user = yield User.findOne({ email });
            if (!user && typeof user !== "object")
                throw new Error404(`User not found!`);
            //  const hashedPwd = await bcrypt.hash(password, 10);
            user.password = password;
            user.otp = undefined;
            user.otpExTime = undefined;
            yield user.save();
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Password updated successfully.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function createShippingAddressSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req.decoded;
            let body = req.body;
            if (!body || typeof body !== "object")
                throw new Error400("Required body !");
            if (!Object.values(body).some((e) => e !== null && e !== "")) {
                throw new Error400("Required all fields !");
            }
            const { name, division, city, area, areaType, landmark, phoneNumber, postalCode, } = body;
            let phnNumber = validBDPhoneNumber(phoneNumber);
            if (!validDigit(phoneNumber))
                throw new Error400("Invalid phone number!");
            if (!phnNumber)
                throw new Error400("Phone number format is not valid!");
            if (!validDigit(postalCode))
                throw new Error400("Invalid postal code format, postal code should be numeric value!");
            let shippingAddressModel = {
                id: "spi_" + Math.floor(Math.random() * 100000000).toString(),
                name,
                division,
                city,
                area,
                areaType,
                landmark,
                phoneNumber: phnNumber,
                postalCode,
                active: false,
            };
            const result = yield Customer.updateOne({ userId: ObjectId(_id) }, { $push: { shippingAddress: shippingAddressModel } }, { upsert: true });
            if (!result)
                throw new Error("Operation failed !");
            NCache.deleteCache(`${_id}_shippingAddress`);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Shipping address added successfully.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function updateShippingAddressSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req.decoded;
            const body = req.body;
            if (!body || typeof body !== "object")
                throw new Error400("Required body !");
            if (!Object.values(body).some((e) => e !== null && e !== "")) {
                throw new Error400("Required all fields !");
            }
            const { id, name, division, city, area, areaType, landmark, phoneNumber, postalCode, active, } = body;
            if (!id)
                throw new Error400("Required address id !");
            let shippingAddressModel = {
                id,
                name,
                division,
                city,
                area,
                areaType,
                landmark,
                phoneNumber,
                postalCode,
                active,
            };
            const result = yield Customer.findOneAndUpdate({ userId: ObjectId(_id) }, {
                $set: {
                    "shippingAddress.$[i]": shippingAddressModel,
                },
            }, { arrayFilters: [{ "i.id": id }] });
            if (!result)
                throw new Error("Failed to update shipping address.");
            NCache.deleteCache(`${_id}_shippingAddress`);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Shipping address updated.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function selectShippingAddressSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req.decoded;
            let { id, active } = req.body;
            if (!id || typeof id !== "string")
                throw new Error400("Required address id !");
            active = active === true ? false : true;
            const result = yield Customer.updateOne({ userId: ObjectId(_id) }, {
                $set: {
                    "shippingAddress.$[j].active": false,
                    "shippingAddress.$[i].active": active,
                },
            }, {
                arrayFilters: [{ "j.id": { $ne: id } }, { "i.id": id }],
                multi: true,
            });
            if (!result)
                throw new Error("Server error !");
            NCache.deleteCache(`${_id}_shippingAddress`);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Default shipping address selected.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function deleteShippingAddressSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req.decoded;
            let id = req.params.id;
            if (!id || typeof id !== "string")
                throw new Error400("Required address id !");
            const result = yield Customer.updateOne({ userId: ObjectId(_id) }, { $pull: { shippingAddress: { id } } });
            if (!result)
                throw new Error("Internal issue !");
            NCache.deleteCache(`${_id}_shippingAddress`);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Address deleted successfully.",
                data: {},
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function updateProfileDataSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.decoded.email;
            const { userEmail } = req.query;
            const body = req.body;
            if (userEmail !== email) {
                throw new Error400("Invalid email address !");
            }
            if (!body || typeof body === "undefined") {
                throw new Error400("Required body with request !");
            }
            const { fullName, dob, gender } = body;
            if (!fullName || typeof fullName !== "string")
                throw new Error400("Required full name !");
            if (!dob || typeof dob !== "string")
                throw new Error400("Required date of birth !");
            if (!gender || typeof gender !== "string")
                throw new Error400("Required gender !");
            let profileModel = {
                fullName,
                dob,
                gender,
            };
            const result = yield User.findOneAndUpdate({ email: email }, { $set: profileModel }, { upsert: true });
            if (result) {
                return res
                    .status(200)
                    .send({ success: true, statusCode: 200, message: "Profile updated." });
            }
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function fetchAuthUserSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const authEmail = req.decoded.email;
            // const ipAddress = req.socket?.remoteAddress;
            let user = yield User.findOne({ email: authEmail }, { password: 0 });
            if (!user || typeof user !== "object")
                throw new Error404("User not found !");
            const userDataToken = generateUserDataToken(user);
            if (!userDataToken)
                throw new Error("Internal issue !");
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Welcome " + (user === null || user === void 0 ? void 0 : user.fullName),
                data: {
                    userToken: userDataToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function fetchAddressBookSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req === null || req === void 0 ? void 0 : req.decoded;
            let shippingAddress = [];
            const buyerDataInCache = NCache.getCache(`${_id}_shippingAddress`);
            if (buyerDataInCache) {
                shippingAddress = buyerDataInCache;
            }
            else {
                const buyerMeta = yield Customer.findOne({ userId: ObjectId(_id) });
                shippingAddress = buyerMeta === null || buyerMeta === void 0 ? void 0 : buyerMeta.shippingAddress;
                NCache.saveCache(`${_id}_shippingAddress`, shippingAddress);
            }
            return res.status(200).json({
                success: true,
                statusCode: 200,
                message: "Data received.",
                data: {
                    shippingAddress,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
function passwordChangeSystem(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req.decoded;
            const { oldPassword, newPassword } = req.body;
            if (!oldPassword || !newPassword)
                throw new Error400(`Required old password and new password !`);
            if (newPassword && typeof newPassword !== "string")
                throw new Error400("Password should be string !");
            if (newPassword.length < 5 || newPassword.length > 8)
                throw new Error400("Password length should be 5 to 8 characters !");
            if (!validPassword(newPassword))
                throw new Error400("Password should contains at least 1 digit, lowercase letter, special character !");
            // find user in db by email
            let user = yield User.findOne({ email: email });
            if (!user && typeof user !== "object")
                throw new Error404(`User not found !`);
            const comparedPassword = yield user.comparePassword(oldPassword);
            if (!comparedPassword) {
                throw new Error400("Password didn't match !");
            }
            user.password = newPassword;
            yield user.save();
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Password updated successfully.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
module.exports = {
    loginSystem,
    registrationSystem,
    accountVerifyByEmailSystem,
    sendOtpForForgotPwdChangeSystem,
    checkOtpForForgotPwdChangeSystem,
    setNewPwdForForgotPwdChangeSystem,
    createShippingAddressSystem,
    updateShippingAddressSystem,
    selectShippingAddressSystem,
    deleteShippingAddressSystem,
    updateProfileDataSystem,
    fetchAuthUserSystem,
    fetchAddressBookSystem,
    passwordChangeSystem,
};
