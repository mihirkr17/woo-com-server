"use strict";
let BaseErrors = require("./baseErrors");
let httpStatusCode = require("./httpStatusCodes");
class Api404Error extends BaseErrors {
    constructor(name, statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.NOT_FOUND, success, message) {
        super(name, statusCode, success, message);
    }
}
