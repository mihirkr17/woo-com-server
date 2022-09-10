"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandlers = (err, req, res, next) => {
    res.status(500).send({ error: err === null || err === void 0 ? void 0 : err.message });
};
module.exports = errorHandlers;
