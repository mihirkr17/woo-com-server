"use strict";
var jwt = require("jsonwebtoken");
module.exports = function setToken(userInfo) {
    const token = jwt.sign({
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
