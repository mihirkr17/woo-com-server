"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandlers = (error, req, res) => {
    console.log(error);
    return res.status(500).send({ error: error === null || error === void 0 ? void 0 : error.message });
};
module.exports = errorHandlers;
