// baseErrors.tsx

class BaseError extends Error {

   name = "";
   message = "";
   statusCode = 500;
   success = false;

   constructor(message: string, name: string, statusCode: any, success: boolean) {

      super(message);

      Object.setPrototypeOf(this, new.target.prototype);

      this.name = name;
      this.message = message;
      this.statusCode = statusCode;
      this.success = success;


      Error.captureStackTrace(this);
   }
}

module.exports = BaseError;