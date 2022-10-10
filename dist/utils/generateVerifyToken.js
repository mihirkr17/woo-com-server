"use strict";
module.exports = function generateVerifyToken() {
    return (Math.random() + 1).toString(36).substring(7);
};
