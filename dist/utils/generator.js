"use strict";
var jwt = require("jsonwebtoken");
const cryPto = require("crypto");
module.exports.generateItemID = () => (Math.floor(10000000 + Math.random() * 999999999999));
module.exports.generateTrackingID = () => ("tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString());
module.exports.generateOrderID = (id) => ("oi_" + cryPto.randomBytes(16).toString('hex').slice(0, 16) + id.slice(0, 4));
module.exports.generateListingID = () => ("lid" + cryPto.randomBytes(16).toString('hex').slice(0, 16));
module.exports.generateVerifyToken = () => (cryPto.randomBytes(16).toString('hex'));
module.exports.generateUUID = () => {
    let str = cryPto.randomBytes(16).toString('hex');
    str = str && str.slice(0, 5) + Math.floor(10000 + Math.random() * 99999).toString();
    return str;
};
module.exports.generateExpireTime = () => {
    let expirationDate = new Date();
    return expirationDate.setMinutes(expirationDate.getMinutes() + 5);
};
module.exports.generateSixDigitNumber = () => {
    let randomBytes = cryPto.randomBytes(4);
    let randomNumber = parseInt(randomBytes.toString('hex'), 16) % 900000 + 100000;
    return randomNumber.toString();
};
module.exports.generateJwtToken = (userInfo) => {
    const token = jwt.sign({
        fullName: userInfo === null || userInfo === void 0 ? void 0 : userInfo.fullName,
        _uuid: userInfo === null || userInfo === void 0 ? void 0 : userInfo._uuid,
        email: userInfo === null || userInfo === void 0 ? void 0 : userInfo.email,
        role: userInfo === null || userInfo === void 0 ? void 0 : userInfo.role,
        status: 'online'
    }, process.env.ACCESS_TOKEN, {
        algorithm: "HS256",
        expiresIn: "16h",
    });
    return token;
};
module.exports.generateUserDataToken = (user) => {
    var _a, _b;
    user = user.toObject();
    user["password"] = undefined;
    if ((user === null || user === void 0 ? void 0 : user.role) === "BUYER") {
        user.buyer["defaultShippingAddress"] = (Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) &&
            ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress.find((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true))) || {};
    }
    const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        algorithm: "HS256",
        expiresIn: "16h",
    });
    return token;
};
module.exports.generateVerificationToken = (email) => {
    const token = jwt.sign({
        email
    }, process.env.ACCESS_TOKEN, {
        algorithm: "HS256",
        expiresIn: "1h",
    });
    return token;
};
