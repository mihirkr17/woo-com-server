import { NextFunction, Request, Response } from "express";
var jwt = require("jsonwebtoken");


/**
 * 
 * @param req 
 * @param res 
 * @param next 
 * @returns true
 * @middleware Verifying valid json web token
 */

const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token; // finding token in http only cookies.

  // if token not present in cookies then return 403 status code and terminate the request here....
  if (!token || typeof token === "undefined") {
    res.clearCookie('is_logged');
    return res.status(204).send();
    // return res.status(401).send({ success: false, statusCode: 401, error: 'Token not found' });
  }


  jwt.verify(
    token,
    process.env.ACCESS_TOKEN,
    function (err: any, decoded: any) {
      // verifying the token with jwt verify method and if token broken then 401 status code will send and terminate the request
      if (err) {
        res.clearCookie("token");
        res.clearCookie('is_logged');
        return res.status(401).send({
          success: false,
          statusCode: 401,
          error: err.message,
        });
      }

      // if success then return email throw req.decoded
      req.decoded = decoded;
      next();
    }
  );
};

// // verify owner
const isRoleOwnerOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authRole = req.decoded.role;

    if (authRole === "OWNER" || authRole === "ADMIN") {
      next();
    } else {
      return res.status(401).send({ success: false, statusCode: 401, error: "Unauthorized access!" });
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
      return res.status(401).send({ success: false, statusCode: 401, error: "Unauthorized access!" });
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
      return res.status(400).send({
        success: false,
        statusCode: 400,
        error: "You are not a user, So you are not authorized for process this.",
      });
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
      return res.status(401).send({ success: false, statusCode: 401, error: "Unauthorized access!" });
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
      return res.status(401).send({ success: false, statusCode: 401, error: "Unauthorized access!" });
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
  isPermitForDashboard
};
