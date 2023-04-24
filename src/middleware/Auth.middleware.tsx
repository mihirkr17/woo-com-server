import { NextFunction, Request, Response } from "express";
var jwt = require("jsonwebtoken");
const apiResponse = require("../errors/apiResponse");


/**
 * 
 * @param req 
 * @param res 
 * @param next 
 * @returns true
 * @middleware Verifying valid json web token
 */

const loadWithJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token; // finding token in http only cookies.

    // if token not present in cookies then return 403 status code and terminate the request here....
    if (!token || typeof token === "undefined") {
      throw new apiResponse.Api401Error('Token not found');
    }


    jwt.verify(
      token,
      process.env.ACCESS_TOKEN,
      function (err: any, decoded: any) {
        // verifying the token with jwt verify method and if token broken then 401 status code will send and terminate the request
        if (err) {
          res.clearCookie("token");
          throw new apiResponse.Api401Error(err?.message);
        }

        // if success then return email throw req.decoded
        req.decoded = decoded;
        next();
      }
    );
  } catch (error: any) {
    next(error);
  }
}

const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token; // finding token in http only cookies.
    const log_tok = req.headers?.authorization?.split(" ")[1] || req.cookies.log_tok;

    // if token not present in cookies then return 403 status code and terminate the request here....
    if (!token || typeof token === "undefined") {
      throw new apiResponse.Api401Error('Token not found');
    }

    if (log_tok !== token) {
      res.clearCookie("token");
      throw new apiResponse.Api401Error('Token is not valid !');
    }
    

    jwt.verify(
      token,
      process.env.ACCESS_TOKEN,
      function (err: any, decoded: any) {
        // verifying the token with jwt verify method and if token broken then 401 status code will send and terminate the request
        if (err) {
          res.clearCookie("token");
          throw new apiResponse.Api401Error(err?.message);
        }

        // if success then return email throw req.decoded
        req.decoded = decoded;
        next();
      }
    );
  } catch (error: any) {
    next(error);
  }
};

// // verify owner
const isRoleOwnerOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authRole = req.decoded.role;

    if (authRole === "OWNER" || authRole === "ADMIN") {
      next();
    } else {
      throw new apiResponse.Api403Error("Forbidden access !");
    }
  } catch (error: any) {
    next(error);
  }
};

// verify seller
const isRoleSeller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authRole = req.decoded.role;

    if (authRole === 'SELLER') {
      next();
    } else {
      throw new apiResponse.Api403Error("Forbidden access !");
    }
  } catch (error: any) {
    next(error);
  }
};

// verify seller
const isRoleBuyer = async (req: Request, res: Response, next: NextFunction) => {

  try {
    const authRole = req.decoded.role;

    if (authRole === "BUYER") {
      next();
    } else {
      throw new apiResponse.Api403Error("Forbidden access !");
    }
  } catch (error: any) {
    next(error);
  }
};



// admin authorization
const isRoleAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authRole: String = req.decoded.role;

    if (authRole === 'ADMIN') {
      next();
    } else {
      throw new apiResponse.Api403Error("Forbidden access !");
    }

  } catch (error: any) {
    next(error);
  }
}

const isPermitForDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const authRole = req.decoded.role;

    if (authRole === 'SELLER' || authRole === 'ADMIN' || authRole === 'OWNER') {
      next();
    } else {
      throw new apiResponse.Api403Error("Forbidden access !");
    }

  } catch (error: any) {
    next(error);
  }
}

module.exports = {
  verifyJWT,
  isRoleOwnerOrAdmin,
  isRoleSeller,
  isRoleBuyer,
  isRoleAdmin,
  isPermitForDashboard,
  loadWithJWT
};
