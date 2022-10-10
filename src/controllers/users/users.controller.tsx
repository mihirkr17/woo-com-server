import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
var jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const userModel = require("../../model/UserModel");
const User = require("../../model/user.model");
const setToken = require("../../utils/setToken");
const generateVerifyToken = require("../../utils/generateVerifyToken");
const { comparePassword } = require("../../utils/comparePassword");
const emailValidator = require("../../helpers/emailValidator");

/**
 * controller --> user login controller
 * request method --> POST
 * required --> BODY
 */
module.exports.userLoginController = async (req: Request, res: Response) => {
  try {
    const verify_token = req.headers.authorization?.split(' ')[1] || undefined;
    const { username, password, loginCredential } = req.body;
    let token: String;
    let userData;
    let credentials;

    const cookieObject: any = {
      // sameSite: "none",
      // secure: true,
      maxAge: 57600000, // 16hr [3600000 -> 1hr]
      httpOnly: true,
    };

    if (typeof loginCredential === 'undefined' || !loginCredential) {
      credentials = 'system';
    } else {
      credentials = loginCredential;
    }

    const existUser = await User.findOne({
      $and: [
        { $or: [{ username }, { email: username }] },
        { loginCredential: credentials }
      ]
    });

    /// third party login system like --> Google
    if (loginCredential === 'thirdParty') {

      if (!existUser || typeof existUser === 'undefined') {
        const user = new User({ email: username, username, loginCredential, accountStatus: 'active' });
        userData = await user.save();

      } else {
        userData = existUser;
      }

      token = setToken(userData);
    }

    // system login
    else {

      if (!existUser) {
        return res.status(400).send({ success: false, statusCode: 400, error: 'User not found !!!' });
      }

      let comparedPassword = await comparePassword(password, existUser?.password);

      if (!comparedPassword) {
        return res.status(400).send({ success: false, statusCode: 400, error: "Password didn't match !!!" });
      }

      if (existUser.verifyToken && !verify_token) {
        res.cookie("verifyToken", existUser.verifyToken, { maxAge: 3600000, httpOnly: false });
        return res.send({ success: true, statusCode: 200, message: 'verifyTokenOnCookie' });
      }

      // next condition
      if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {

        if (existUser?.verifyToken !== verify_token) {
          return res.status(400).send({ success: false, statusCode: 400, error: 'Required valid token !!!' });
        }

        await User.updateOne({ $or: [{ username }, { email: username }] }, { $unset: { verifyToken: 1 }, $set: { accountStatus: 'active' } });
        res.clearCookie('verifyToken');
      }

      token = setToken(existUser);
    }

    if (token) {
      res.cookie("token", token, cookieObject);
      return res.status(200).send({ message: "isLogin", statusCode: 200, success: true });
    }
  } catch (error: any) {
    return res.status(400).send({ success: false, statusCode: 400, error: error.message });
  }
};

/**
 * controller --> user registration controller
 * request method --> POST
 * required --> BODY
 */
module.exports.userRegisterController = async (req: Request, res: Response, next: any) => {
  try {
    const { username, email, password } = req.body;

    if (!req.body) {
      return res.status(400).send({ success: false, statusCode: 400, error: "Information not found !!!" });
    }

    if (username.length <= 3 && username.length >= 9) {
      return res.status(400).send({ success: false, statusCode: 400, error: 'Username length must between 4 to 8 characters !!!' });
    }

    if (email.length <= 0) {
      return res.status(400).send({ success: false, statusCode: 400, error: 'Email address required !!!' });
    }

    if (!emailValidator(email)) {
      return res.status(400).send({ success: false, statusCode: 400, error: 'Invalid email address !!!' });
    }

    if (password.length <= 0) {
      return res.status(400).send({ success: false, statusCode: 400, error: 'Password required !!!' });
    }

    if (password.length <= 4) {
      return res.status(400).send({ success: false, statusCode: 400, error: 'Password must be greater than 5 characters !!!' });
    }

    let existUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existUser) {
      return res.status(400).send({ success: false, statusCode: 400, error: "User already exists ! Please try another username or email address." });
    }

    let body = req.body;
    body['verifyToken'] = generateVerifyToken();

    let user = new User(body);

    const result = await user.save();

    if (!result) {
      return res.status(500).send({ success: false, statusCode: 500, error: "Internal error!" });
    }

    res.cookie("verifyToken", result?.verifyToken, { maxAge: 3600000, httpOnly: false });

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Registration success. Please verify your account.",
      data: { username: result?.username, verifyToken: result?.verifyToken, email: result?.email }
    });
  } catch (error: any) {
    return res.status(400).send({ success: false, statusCode: 400, error: error.message });
  }
};


module.exports.userRegisterVerify = async (req: Request, res: Response, next: any) => {
  try {
    const verify_token = req.headers.authorization?.split(' ')[1] || undefined;

    const existUser = await User.findOne({ verifyToken: verify_token });


    if (!existUser) {
      return res.status(400).send({ success: false, statusCode: 400, error: 'User not found !!!' });
    }

    if (existUser.verifyToken && !verify_token) {
      res.cookie("verifyToken", existUser.verifyToken, { maxAge: 3600000, httpOnly: false });
      return res.send({ success: true, statusCode: 200, message: 'verifyTokenOnCookie' });
    }

    // next condition
    if (existUser.verifyToken && (verify_token && typeof verify_token !== 'undefined')) {

      if (existUser?.verifyToken !== verify_token) {
        return res.status(400).send({ success: false, statusCode: 400, error: 'Invalid token !!!' });
      }

      await User.updateOne(
        { verifyToken: verify_token },
        {
          $unset: { verifyToken: 1 },
          $set: { accountStatus: 'active' }
        }
      );

      res.clearCookie('verifyToken');

      return res.status(200).send({ success: true, statusCode: 200, message: "User verified.", data: { username: existUser?.username } });
    }
  } catch (error) {

  }
}

/**
 * controller --> fetch authenticate user information
 * request method --> GET
 * required --> NONE
 */
module.exports.fetchAuthUser = async (
  req: Request,
  res: Response,
  next: any
) => {
  try {
    const authEmail = req.decoded.email;
    const role = req.decoded.role;

    const result = await User.findOne({ $and: [{ email: authEmail }, { role: role }, { accountStatus: 'active' }] }).exec();

    if (!result || typeof result !== "object") {
      return res.status(404).send({ success: false, statusCode: 404, error: "User not found!" });
    }

    await User.updateOne(
      { email: authEmail },
      { $pull: { myCartProduct: { stock: "out" } } }
    )

    return res
      .status(200)
      .send({ success: true, statusCode: 200, message: 'Welcome ' + result?.username, data: result });
  } catch (error: any) {
    next(error);
  }
};

module.exports.signUser = async (req: Request, res: Response, next: any) => {
  try {
    const db = await dbConnection();

    const authEmail: string = req.headers.authorization || "";

    if (!authEmail || typeof authEmail !== "string") {
      return res
        .status(400)
        .send({ success: false, error: "Authorization header is missing!" });
    }

    const setToken = (role: String) => {
      const cookieObject: any = {
        // sameSite: "none",
        // secure: true,
        maxAge: 7200000, //3600000
        httpOnly: true,
      };

      const payload = {
        email: authEmail,
        role: role,
      };

      const token = jwt.sign({ email: authEmail }, process.env.ACCESS_TOKEN, {
        algorithm: "HS256",
        expiresIn: "2h",
      });

      return res.cookie("token", token, cookieObject)
        ? res
          .status(200)
          .send({ message: "Login success", statusCode: 200, success: true })
        : res.status(400).send({ error: "Bad request", success: false });
    };

    const existsUser = await db
      .collection("users")
      .findOne({ email: authEmail });

    if (existsUser && typeof existsUser === "object") {
      return setToken(existsUser?.role);
    }

    // user model
    const model = new userModel(req.body, authEmail);
    const errs = model.errorReports();

    if (errs) {
      return res.status(400).send({ success: false, error: errs });
    }

    const newUser = await db
      .collection("users")
      .insertOne(model)
      .then((d: any) => d[0]);

    return setToken(newUser.role);
  } catch (error: any) {
    next(error);
  }
};

module.exports.signOutUser = async (req: Request, res: Response) => {
  try {
    let authEmail = req.decoded.email;

    if (authEmail) {
      // if user logout then cart will be empty
      await User.updateOne({ email: authEmail }, { myCartProduct: [] }, { new: true });
    }

    res.clearCookie("token");

    res.status(200).send({ success: true, statusCode: 200, message: "Sign out successfully" });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.switchRole = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userEmail = req.decoded.email;
    const userID = req.headers.authorization?.split(" ")[1];
    const userRole: string = req.params.role;
    let roleModel: any;

    if (!userID) {
      return res
        .status(400)
        .send({ message: "Bad request! headers is missing" });
    }

    if (userRole === "user") {
      roleModel = { role: "user" };
    }

    if (userRole === "seller") {
      roleModel = { role: "seller" };
    }

    if (userID && userEmail) {
      const result = await db
        .collection("users")
        .updateOne(
          { _id: ObjectId(userID), email: userEmail },
          { $set: roleModel },
          { upsert: true }
        );

      if (result) return res.status(200).send(result);
    }
  } catch (error: any) {
    res.status(500).send({ error: error?.message });
  }
};

module.exports.updateProfileData = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();
    const email: string = req.decoded.email;
    const result = await db
      .collection("users")
      .updateOne({ email: email }, { $set: req.body }, { upsert: true });
    res.status(200).send(result);
  } catch (error: any) {
    res.status(500).send({ error: error?.message });
  }
};

module.exports.makeAdmin = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userId: string = req.params.userId;

    if (!ObjectId.isValid(userId)) {
      return res
        .status(400)
        .send({ success: false, error: "User ID not valid" });
    }

    const result = await db
      .collection("users")
      .updateOne(
        { _id: ObjectId(userId) },
        { $set: { role: "admin" } },
        { upsert: true }
      );

    return result
      ? res.status(200).send({ success: true, message: "Permission granted" })
      : res.status(500).send({ success: false, error: "Failed" });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.demoteToUser = async (
  req: Request,
  res: Response,
  next: any
) => {
  try {
    const db = await dbConnection();

    const userId: string = req.params.userId;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).send({ error: "User Id is not valid" });
    }

    res
      .status(200)
      .send(
        await db
          .collection("users")
          .updateOne(
            { _id: ObjectId(userId) },
            { $set: { role: "user" } },
            { upsert: true }
          )
      );
  } catch (error: any) {
    next(error);
  }
};

module.exports.manageUsers = async (req: Request, res: Response, next: any) => {
  try {
    const db = await dbConnection();

    const uType = req.query.uTyp;
    res
      .status(200)
      .send(await db.collection("users").find({ role: uType }).toArray());
  } catch (error: any) {
    next(error);
  }
};

module.exports.makeSellerRequest = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userEmail = req.params.userEmail;
    let body = req.body;
    let existSellerName;

    if (body?.seller) {
      existSellerName = await db.collection("users").findOne({
        seller: body?.seller,
      });
    }

    if (existSellerName) {
      return res
        .status(200)
        .send({ message: "Seller name exists ! try to another" });
    } else {
      const result = await db.collection("users").updateOne(
        { email: userEmail },
        {
          $set: body,
        },
        { upsert: true }
      );
      res.status(200).send({ result, message: "success" });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.permitSellerRequest = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userId: string = req.params.userId;

    const result = await db.collection("users").updateOne(
      { _id: ObjectId(userId) },
      {
        $set: { role: "seller", seller_request: "ok", isSeller: true },
      },
      { upsert: true }
    );
    result?.acknowledged
      ? res.status(200).send({ message: "Request Success" })
      : res.status(400).send({ message: "Bad Request" });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.checkSellerRequest = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    res
      .status(200)
      .send(
        await db
          .collection("users")
          .find({ seller_request: "pending" })
          .toArray()
      );
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};
