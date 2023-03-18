"use strict";
// baseErrors.tsx
class BaseError extends Error {
    constructor(message, name, statusCode, success) {
        super(message);
        this.name = "";
        this.message = "";
        this.statusCode = 500;
        this.success = false;
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = name;
        this.message = message;
        this.statusCode = statusCode;
        this.success = success;
        Error.captureStackTrace(this);
    }
}
module.exports = BaseError;
