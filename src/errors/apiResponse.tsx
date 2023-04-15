// apiResponse.tsx

let BaseErrors = require("./baseErrors");
let httpStatusCode = require("./httpStatusCodes");

class Api400Error extends BaseErrors {
   constructor(message: string, name: string = "ClientError", statusCode = httpStatusCode?.BAD_REQUEST, success = false) {
      super(message, name, statusCode, success);
   }
}

class Api401Error extends BaseErrors {
   constructor(message: string, name: string = "Unauthorized", statusCode = httpStatusCode?.UNAUTHORIZED, success = false) {
      super(message, name, statusCode, success);
   }
}

class Api403Error extends BaseErrors {
   constructor(message: string, name: string = "Forbidden", statusCode = httpStatusCode?.FORBIDDEN, success = false) {
      super(message, name, statusCode, success);
   }
}


class Api404Error extends BaseErrors {
   constructor(message: string, name: string = "NotFound", statusCode = httpStatusCode?.NOT_FOUND, success = false) {
      super(message, name, statusCode, success);
   }
}

class Api500Error extends BaseErrors {
   constructor(message: string, name: string = "ServerError", statusCode = httpStatusCode?.INTERNAL_SERVER, success = false) {
      super(message, name, statusCode, success);
   }
}

class Api503Error extends BaseErrors {
   constructor(message: string, name: string = "ServiceUnavailable", statusCode = httpStatusCode?.SERVICE_UNAVAILABLE, success = false) {
      super(message, name, statusCode, success);
   }
}

module.exports = { Api400Error, Api401Error, Api403Error, Api404Error, Api500Error, Api503Error }