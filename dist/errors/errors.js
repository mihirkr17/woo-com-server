"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const returnErrors = (err, req, res, next) => {
    res.status((err === null || err === void 0 ? void 0 : err.statusCode) || 500).send({ message: err === null || err === void 0 ? void 0 : err.message, name: err === null || err === void 0 ? void 0 : err.name, statusCode: err === null || err === void 0 ? void 0 : err.statusCode, success: err === null || err === void 0 ? void 0 : err.success });
};
module.exports = returnErrors;
