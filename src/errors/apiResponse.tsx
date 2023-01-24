// apiResponse.tsx

let BaseErrors = require("./baseErrors");
let httpStatusCode = require("./httpStatusCodes");

class Api400Error extends BaseErrors {
   constructor(name: string, message: string, statusCode = httpStatusCode?.BAD_REQUEST, success = false) {
      super(name, message, statusCode, success);
   }
}

class Api401Error extends BaseErrors {
   constructor(name: string, message: string, statusCode = httpStatusCode?.UNAUTHORIZED, success = false) {
      super(name, message, statusCode, success);
   }
}

class Api403Error extends BaseErrors {
   constructor(name: string, message: string, statusCode = httpStatusCode?.FORBIDDEN, success = false) {
      super(name, message, statusCode, success);
   }
}


class Api404Error extends BaseErrors {
   constructor(name: string, message: string, statusCode = httpStatusCode?.NOT_FOUND, success = false) {
      super(name, message, statusCode, success);
   }
}

class Api500Error extends BaseErrors {
   constructor(name: string, message: string, statusCode = httpStatusCode?.INTERNAL_SERVER, success = false) {
      super(name, message, statusCode, success);
   }
}

class Api200Success extends BaseErrors {
   constructor(name: string, message: string, statusCode = httpStatusCode?.OK, success = true) {
      super(name, message, statusCode, success);
   }
}

module.exports = { Api400Error, Api401Error, Api403Error, Api404Error }