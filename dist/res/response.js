"use strict";
/**
 * [httpCode description]
 *
 * @var {[type]}
 */
const httpCode = {
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER: 500,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    SERVICE_UNAVAILABLE: 503,
};
const AppError = require("./errors/Errors");
/**
 * [Error400 description]
 */
class Error400 extends AppError {
    constructor(message, name = "ClientError", statusCode = httpCode === null || httpCode === void 0 ? void 0 : httpCode.BAD_REQUEST, success = false) {
        super(message, name, statusCode, success);
    }
}
/**
 * [Error401 description]
 */
class Error401 extends AppError {
    constructor(message, name = "Unauthorized", statusCode = httpCode === null || httpCode === void 0 ? void 0 : httpCode.UNAUTHORIZED, success = false) {
        super(message, name, statusCode, success);
    }
}
/**
 * [Error403 description]
 */
class Error403 extends AppError {
    constructor(message, name = "Forbidden", statusCode = httpCode === null || httpCode === void 0 ? void 0 : httpCode.FORBIDDEN, success = false) {
        super(message, name, statusCode, success);
    }
}
/**
 * [Error404 description]
 */
class Error404 extends AppError {
    constructor(message, name = "NotFound", statusCode = httpCode === null || httpCode === void 0 ? void 0 : httpCode.NOT_FOUND, success = false) {
        super(message, name, statusCode, success);
    }
}
/**
 * [Error500 description]
 */
class Error500 extends AppError {
    constructor(message, name = "ServerError", statusCode = httpCode === null || httpCode === void 0 ? void 0 : httpCode.INTERNAL_SERVER, success = false) {
        super(message, name, statusCode, success);
    }
}
/**
 * [Error503 description]
 */
class Error503 extends AppError {
    constructor(message, name = "ServiceUnavailable", statusCode = httpCode === null || httpCode === void 0 ? void 0 : httpCode.SERVICE_UNAVAILABLE, success = false) {
        super(message, name, statusCode, success);
    }
}
/**
 * [Success description]
 */
class Success {
    constructor(res, params = {}) {
        this.message = "";
        this.success = true;
        this.statusCode = 200;
        this.data = null;
        const { data, message } = params;
        this.message = message;
        this.data = data;
        if (res) {
            res.status(this.statusCode).send({
                success: this.success,
                message: this.message,
                statusCode: this.statusCode,
                data: this === null || this === void 0 ? void 0 : this.data,
            });
        }
    }
}
/**
 * [exports description]
 *
 * @var {[type]}
 */
module.exports = {
    Error400,
    Error401,
    Error403,
    Error404,
    Error500,
    Error503,
    Success,
};
