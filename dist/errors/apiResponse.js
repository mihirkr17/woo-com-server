"use strict";
// apiResponse.tsx
let BaseErrors = require("./baseErrors");
let httpStatusCode = require("./httpStatusCodes");
class Api400Error extends BaseErrors {
    constructor(message, name = "ClientError", statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.BAD_REQUEST, success = false) {
        super(message, name, statusCode, success);
    }
}
class Api401Error extends BaseErrors {
    constructor(message, name = "Unauthorized", statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.UNAUTHORIZED, success = false) {
        super(message, name, statusCode, success);
    }
}
class Api403Error extends BaseErrors {
    constructor(message, name = "Forbidden", statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.FORBIDDEN, success = false) {
        super(message, name, statusCode, success);
    }
}
class Api404Error extends BaseErrors {
    constructor(message, name = "NotFound", statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.NOT_FOUND, success = false) {
        super(message, name, statusCode, success);
    }
}
class Api500Error extends BaseErrors {
    constructor(message, name = "ServerError", statusCode = httpStatusCode === null || httpStatusCode === void 0 ? void 0 : httpStatusCode.INTERNAL_SERVER, success = false) {
        super(message, name, statusCode, success);
    }
}
module.exports = { Api400Error, Api401Error, Api403Error, Api404Error, Api500Error };
