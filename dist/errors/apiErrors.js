"use strict";
let BaseErrors = require("./baseErrors");
let httpStatusCode = require("./httpStatusCodes");
class Api400Error extends BaseErrors {
    constructor(name, message, statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.BAD_REQUEST, success = false) {
        super(name, statusCode, success, message);
    }
}
class Api401Error extends BaseErrors {
    constructor(name, message, statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.UNAUTHORIZED, success = false) {
        super(name, statusCode, success, message);
    }
}
class Api403Error extends BaseErrors {
    constructor(name, message, statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.FORBIDDEN, success = false) {
        super(name, statusCode, success, message);
    }
}
class Api404Error extends BaseErrors {
    constructor(name, message, statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.NOT_FOUND, success = false) {
        super(name, statusCode, success, message);
    }
}
module.exports = { Api400Error, Api401Error, Api403Error, Api404Error };
