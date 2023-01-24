"use strict";
// apiResponse.tsx
let BaseErrors = require("./baseErrors");
let httpStatusCode = require("./httpStatusCodes");
class Api400Error extends BaseErrors {
    constructor(name, message, statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.BAD_REQUEST, success = false) {
        super(name, message, statusCode, success);
    }
}
class Api401Error extends BaseErrors {
    constructor(name, message, statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.UNAUTHORIZED, success = false) {
        super(name, message, statusCode, success);
    }
}
class Api403Error extends BaseErrors {
    constructor(name, message, statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.FORBIDDEN, success = false) {
        super(name, message, statusCode, success);
    }
}
class Api404Error extends BaseErrors {
    constructor(name, message, statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.NOT_FOUND, success = false) {
        super(name, message, statusCode, success);
    }
}
class Api500Error extends BaseErrors {
    constructor(name, message, statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.INTERNAL_SERVER, success = false) {
        super(name, message, statusCode, success);
    }
}
class Api200Success extends BaseErrors {
    constructor(name, message, statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.OK, success = true) {
        super(name, message, statusCode, success);
    }
}
module.exports = { Api400Error, Api401Error, Api403Error, Api404Error };
