"use strict";
// baseSuccess.tsx
class BaseSuccess {
    constructor(name, message, statusCode, success) {
        this.success = true;
        this.statusCode = 200;
        this.message = "";
        this.name = "";
        this.name = name;
        this.message = message;
        this.statusCode = statusCode;
        this.success = success;
    }
}
module.exports = function baseSuccess(name, message, statusCode, success) {
    return;
};
