"use strict";
var jwt = require("jsonwebtoken");
module.exports = function setToken(userInfo) {
    const payload = {
        email: userInfo === null || userInfo === void 0 ? void 0 : userInfo.email,
        role: userInfo === null || userInfo === void 0 ? void 0 : userInfo.role,
        status: 'online'
    };
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN, {
        algorithm: "HS256",
        expiresIn: "16h",
    });
    return token;
};
