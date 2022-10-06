import { Request, Response } from "express";
var jwt = require("jsonwebtoken");
const { dbConnection } = require("../utils/db");

const verifyJWT = async (req: Request, res: Response, next: any) => {
  const token = req.cookies.token; // finding token in http only on cookies.

  // if token not present in cookies then return 403 status code and terminate the request here....
  if (!token || typeof token === "undefined") {
    return res
      .status(403)
      .send({ success: false, statusCode: 403, error: "Login Expired !" });
  }

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN,
    function (err: any, decoded: any) {
      // verifying the token with jwt verify method and if token broken then 401 status code will send and terminate the request
      if (err) {
        res.clearCookie("token");
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
const checkingOwnerOrAdmin = async (req: Request, res: Response, next: any) => {
  const db = await dbConnection();

  const authEmail = req.decoded.email;
  const findAuthInDB = await db.collection("users").findOne({
    email: authEmail && authEmail,
  });

  if (findAuthInDB.role !== "owner" || findAuthInDB.role !== "admin") {
    return res.status(400).send({
      success: false,
      statusCode: 400,
      error:
        "You are not a owner or admin, So you are not authorized for process this.",
    });
  }

  next();
};

// verify seller
const checkingSeller = async (req: Request, res: Response, next: any) => {
  const db = await dbConnection();

  const authEmail = req.decoded.email;
  const findAuthInDB = await db.collection("users").findOne({
    email: authEmail && authEmail,
  });

  if (findAuthInDB.role !== "seller") {
    return res.status(400).send({
      success: false,
      statusCode: 400,
      error:
        "You are not a seller, So you are not authorized for process this.",
    });
  }

  next();
};

// verify seller
const checkingUser = async (req: Request, res: Response, next: any) => {
  const db = await dbConnection();

  const authEmail = req.decoded.email;
  const findAuthInDB = await db.collection("users").findOne({
    email: authEmail && authEmail,
  });

  if (findAuthInDB.role !== "user") {
    return res.status(400).send({
      success: false,
      statusCode: 400,
      error: "You are not a user, So you are not authorized for process this.",
    });
  }

  next();
};

module.exports = {
  verifyJWT,
  checkingOwnerOrAdmin,
  checkingSeller,
  checkingUser,
};
