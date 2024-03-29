import { NextFunction, Request, Response } from "express";
var jwt = require("jsonwebtoken");
const apiResponse = require("../res/response");


/**
 * 
 * @param req 
 * @param res 
 * @param next 
 * @returns true
 * @middleware Verifying valid json web token
 */


const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers?.authorization?.split(" ")[1] || req.cookies.log_tok;

    // if token not present in cookies then return 401 unauthorized errors...
    if (!token || typeof token === "undefined") {
      throw new apiResponse.Error401('Token not found');
    }

    jwt.verify(
      token,
      process.env.ACCESS_TOKEN,
      function (err: any, decoded: any) {
        // verifying the token with jwt verify method and if token broken then 401 status code will send and terminate the request
        if (err) {
          res.clearCookie("token");
          throw new apiResponse.Error401(err?.message);
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
      throw new apiResponse.Error403("Forbidden access !");
    }
  } catch (error: any) {
    next(error);
  }
};

// verify seller
const isSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authRole = req.decoded.role;

    if (authRole === 'SUPPLIER') {
      next();
    } else {
      throw new apiResponse.Error403("Forbidden access !");
    }
  } catch (error: any) {
    next(error);
  }
};

// verify seller
const isCustomer = (req: Request, res: Response, next: NextFunction) => {

  const authRole = req.decoded.role;

  if (authRole === "CUSTOMER") {
    next();
  } else {
    throw new apiResponse.Error403("Forbidden access !");
  }
};



// admin authorization
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authRole: String = req.decoded.role;

    if (authRole === 'ADMIN') {
      next();
    } else {
      throw new apiResponse.Error403("Forbidden access !");
    }

  } catch (error: any) {
    next(error);
  }
}

const isPermitForDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const authRole = req.decoded.role;

    if (authRole === 'SUPPLIER' || authRole === 'ADMIN' || authRole === 'OWNER') {
      next();
    } else {
      throw new apiResponse.Error403("Forbidden access !");
    }

  } catch (error: any) {
    next(error);
  }
}


async function verifyEmailByJWT(req: Request, res: Response, next: NextFunction) {
  const { token } = req.query; // getting from query

  // if token not present in cookies then return 401 unauthorized errors...
  if (!token || typeof token === "undefined") {
    throw new apiResponse.Error401('Required verification token !');
  }

  try {
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err: any, decoded: any) {
      if (err) return res.status(401).json({ success: false, statusCode: 401, message: "Invalid token !" });
      req.decoded = decoded;
      next();
    });

  } catch (error: any) {
    next(error);
  }
}

module.exports = {
  verifyJWT,
  isRoleOwnerOrAdmin,
  isSupplier,
  isCustomer,
  isAdmin,
  isPermitForDashboard,
  verifyEmailByJWT
};
