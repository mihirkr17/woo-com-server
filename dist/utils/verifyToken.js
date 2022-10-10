"use strict";
module.exports = function generateVerifyToken(token) {
    return Math.round(Math.random() * 700000);
};
