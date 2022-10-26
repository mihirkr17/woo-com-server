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
    const { username, password, authProvider } = req.body;
    let token: String;
    let userData;
    let credentials;

    const cookieObject: any = {
      // sameSite: "none",
      // secure: true,
      maxAge: 57600000, // 16hr [3600000 -> 1hr]ms
      httpOnly: true,
    };

    if (typeof authProvider === 'undefined' || !authProvider) {
      credentials = 'system';
    } else {
      credentials = authProvider;
    }

    const existUser = await User.findOne({
      $and: [
        { $or: [{ username }, { email: username }] },
        { authProvider: credentials }
      ]
    });

    /// third party login system like --> Google
    if (authProvider === 'thirdParty') {

      if (!existUser || typeof existUser === 'undefined') {
        const user = new User({ email: username, username, authProvider, accountStatus: 'active' });
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
      res.cookie("is_logged", existUser?._id, {httpOnly: false, maxAge: 57600000});
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
    let result: any;

    const db = await dbConnection();

    result = await User.findOne({ $and: [{ email: authEmail }, { role: role }, { accountStatus: 'active' }] });

    if (!result || typeof result !== "object") {
      return res.status(404).send({ success: false, statusCode: 404, error: "User not found!" });
    }

    result.password = undefined;
    result.authProvider = undefined;
    result.createdAt = undefined;

    if (result?.role === 'user') {
      const cartItems = await db.collection('shoppingCarts').countDocuments({ customerEmail: authEmail });
      result['shoppingCartItems'] = cartItems || 0;
    }

    return res
      .status(200)
      .send({ success: true, statusCode: 200, message: 'Welcome ' + result?.username, data: result });

  } catch (error: any) {
    next(error);
  }
};

module.exports.signOutUser = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");
    res.clearCookie('is_logged');

    res.status(200).send({ success: true, statusCode: 200, message: "Sign out successfully" });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
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
    const authEmail = req.decoded.email;
    const authRole = req.decoded.role;

    let user = await User.findOne({ $and: [{ email: authEmail }, { role: 'user' }] });

    if (!user) {
      return res.status(404).send({ success: false, statusCode: 404, error: 'User not found' });
    }

    if (user?.isSeller === 'pending') {
      return res.status(200).send({
        success: false,
        statusCode: 200,
        error: 'You already send a seller request. We are working for your request, and it will take sometime to verify'
      });
    }

    let body = req.body;

    let businessInfo = {
      taxID: body?.taxID,
      stateTaxID: body?.stateTaxID,
      creditCard: body?.creditCard,
    }

    let sellerInfo = {
      fName: body?.fName,
      lName: body?.lName,
      dateOfBirth: body?.dateOfBirth,
      phone: body?.phone,
      address: {
        street: body?.street,
        thana: body?.thana,
        district: body?.district,
        state: body?.state,
        country: body?.country,
        pinCode: body?.pinCode
      }
    }

    let inventoryInfo = {
      earn: 0,
      totalSell: 0,
      totalProducts: 0,
      storeName: body?.storeName,
      storeCategory: body?.categories,
      storeAddress: {
        street: body?.street,
        thana: body?.thana,
        district: body?.district,
        state: body?.state,
        country: body?.country,
        pinCode: body?.pinCode
      }
    }

    let isUpdate = await User.updateOne(
      { $and: [{ email: authEmail }, { role: authRole }] },
      { $set: { businessInfo, sellerInfo, inventoryInfo, isSeller: 'pending' } },
      { new: true }
    );

    if (isUpdate) {
      return res
        .status(200)
        .send({ success: true, statusCode: 200, message: "Thanks for sending a seller request. We are working for your request" });
    }

  } catch (error: any) {
    res.status(400).send({ success: false, statusCode: 400, error: error?.message });
  }
};


// Permit the seller request
module.exports.permitSellerRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.headers.authorization?.split(',')[0];
    const userEmail = req.headers.authorization?.split(',')[1];

    const user = await User.findOne({ $and: [{ email: userEmail }, { _id: userId }, { isSeller: 'pending' }] });

    if (!user) {
      return res.status(400).send({ success: false, statusCode: 400, error: 'Sorry! request user not found.' });
    }

    let result = await User.updateOne(
      { email: userEmail },
      {
        $set: { role: "seller", isSeller: 'fulfilled', becomeSellerAt: new Date() },
        $unset: { shoppingCartItems: 1, shippingAddress: 1 }
      },
      { new: true }
    );

    result?.acknowledged
      ? res.status(200).send({ success: true, statusCode: 200, message: "Request Success" })
      : res.status(400).send({ success: false, statusCode: 400, error: "Bad Request" });

  } catch (error: any) {
    res.status(500).send({ success: false, statusCode: 500, error: error?.message });
  }
};


/**
 * controller --> fetch seller request in admin dashboard
 * request method --> GET
 * required --> NONE
 */
module.exports.checkSellerRequest = async (req: Request, res: Response) => {
  try {
    let sellers = await User.find({ isSeller: 'pending' });

    sellers.forEach((user: any) => {
      delete user?.password;
    });

    return res.status(200).send({ success: true, statusCode: 200, data: sellers });
  } catch (error: any) {
    res.status(500).send({ success: false, statusCode: 500, error: error?.message });
  }
};
