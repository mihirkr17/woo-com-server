"use strict";
const cryptoGraphy = require("crypto");
module.exports = function generateVerifyToken() {
    return cryptoGraphy.randomBytes(16).toString('hex');
};
