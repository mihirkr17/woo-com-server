// src/controllers/auth.controller.ts

import { NextFunction, Request, Response } from "express";
const User = require("../model/user.model");
const { MyStore, Buyer } = require("../model/usersmeta.model");
const {
  Api400Error,
  Api500Error,
  Api404Error,
} = require("../errors/apiResponse");
const bcrypt = require("bcrypt");
const smtpSender = require("../services/email.service");
const {
  verify_email_html_template,
  send_six_digit_otp_template,
} = require("../templates/email.template");
const {
  generateExpireTime,
  generateSixDigitNumber,
  generateJwtToken,
  generateUserDataToken,
  generateVerificationToken,
} = require("../utils/generator");
const { validEmail, validPassword } = require("../utils/validator");

const {
  countUserByEmail,
  findUserByEmail,
} = require("../services/userService");

// buyers controllers
/**
 * [async description]
 *
 * @param   {Request}       req   [req description]
 * @param   {Response}      res   [res description]
 * @param   {NextFunction}  next  [next description]
 *
 * @return  {[type]}              [return description]
 */
async function loginSystem(req: Request, res: Response, next: NextFunction) {
  try {
    const { email: inputEmail, password: inputPassword } = req.body;

    let user = await User.findOne({ email: inputEmail }); //findUserByEmail(inputEmail);

    if (!user) throw new Api400Error(`User with ${inputEmail} not found!`);

    const { email, verified, accountStatus, fullName, devices } = user || {};

    const matchedPwd = await user.comparePassword(inputPassword);

    if (!matchedPwd) throw new Api400Error("Password didn't matched !");

    if (!verified || accountStatus === "Inactive") {
      const verifyToken = generateVerificationToken({ email });

      const info = await smtpSender({
        to: email,
        subject: "Verify email address",
        html: verify_email_html_template(verifyToken, fullName, req?.appUri),
      });

      if (!info?.response) throw new Error("Internal error !");

      return res.status(200).send({
        success: true,
        statusCode: 200,
        data: {
          returnEmail: email,
          action: "ACCOUNT_VERIFY_REQUEST",
        },
        message: `Go to ${email} and confirm email for verification.`,
      });
    }

    const loginToken = generateJwtToken(user);

    const userDataToken = generateUserDataToken(user);

    if (!loginToken || !userDataToken)
      throw new Error("Login failed due to internal issue !");

    const newDevice = {
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    };

    let filterDevice =
      (devices &&
        devices.filter(
          (item: any) => item?.ipAddress !== newDevice?.ipAddress
        )) ||
      [];

    user.devices = [...filterDevice, newDevice];
    await user.save();

    // if all operation success then return the response
    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Login success",
      data: {
        action: "LOGIN",
        u_data: userDataToken,
        token: loginToken,
        role: user?.role,
      },
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * [async description]
 *
 * @return  {[type]}  [return description]
 */
async function registrationSystem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let body = req.body;
    const requiredRoles: string[] = ["buyer", "supplier", "admin"];
    const { role } = req.query as { role: string };

    if (!role) throw new Api400Error("Required role query in url !");

    if (!requiredRoles.includes(role))
      throw new Api400Error("Invalid role type in query !");

    let existUser = await countUserByEmail(body?.email);

    if (existUser >= 1)
      throw new Api400Error(
        "User already exists, Please try another email address !"
      );

    const verifyToken = generateVerificationToken({ email: body?.email });

    const emailResult = await smtpSender({
      to: body?.email,
      subject: "Verify email address",
      html: verify_email_html_template(verifyToken, body?.fullName),
    });

    if (!emailResult?.response)
      throw new Api400Error("Verification code not send to your email !");

    if (role === "buyer") {
      body["role"] = "BUYER";
    }
    if (role === "supplier") {
      body["role"] = "SUPPLIER";
    }
    if (role === "admin") {
      body["role"] = "ADMIN";
    }

    await User.insertOne(body);

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: `Thanks for your information. Verification code send to ${body?.email}`,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function accountVerifyByEmailSystem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { email } = req.decoded;

    let user = await User.findOne({ email });

    if (!user) throw new Api400Error(`Sorry account with ${email} not found`);

    if (user.verified && user.accountStatus === "Active") {
      return res.status(200).send({
        success: true,
        statusCode: 200,
        message: "Your account already verified.",
        data: {},
      });
    }

    user.verified = true;
    user.accountStatus = "Active";

    await user.save();

    return res.redirect(301, `http://localhost:3000/login?email=${email}`);

    //  return res.status(200).send({
    //    success: true,
    //    statusCode: 200,
    //    message: `Congrats! Account with ${email} verification complete.`,
    //    data: {
    //      returnEmail: email,
    //    },
    //  });
  } catch (error) {
    next(error);
  }
}

async function sendOtpForForgotPwdChangeSystem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { email } = req.body;

    if (!email) throw new Api400Error("Required email from body !");

    const user = await User.findOne({ email });

    if (!user) throw new Api404Error(`User with ${email} Not found`);

    const otp = generateSixDigitNumber();

    const info = await smtpSender({
      to: email, // the user email
      subject: "Reset your WooKart Password",
      html: send_six_digit_otp_template(otp, user?.fullName),
    });

    if (!info?.response)
      throw new Error(
        "Sorry ! Something wrong in your email. please provide valid email address."
      );

    const otpExTime = new Date(Date.now() + 5 * 60 * 1000); // 5mins added with current time

    user.otp = otp;
    user.otpExTime = otpExTime;
    await user.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "We have send otp to your email.",
      data: {
        otpExTime: otpExTime.getTime(),
        returnEmail: user?.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function passwordChangeSystem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { email } = req.decoded;

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      throw new Api400Error(`Required old password and new password !`);

    if (newPassword && typeof newPassword !== "string")
      throw new Api400Error("Password should be string !");

    if (newPassword.length < 5 || newPassword.length > 8)
      throw new Api400Error("Password length should be 5 to 8 characters !");

    if (!validPassword(newPassword))
      throw new Api400Error(
        "Password should contains at least 1 digit, lowercase letter, special character !"
      );

    // find user in db by email
    let user = await User.findOne({ email: email });

    if (!user && typeof user !== "object")
      throw new Api404Error(`User not found !`);

    const comparedPassword = await bcrypt.compare(oldPassword, user?.password);

    if (!comparedPassword) {
      throw new Api400Error("Password didn't match !");
    }

    let hashedPwd = await bcrypt.hash(newPassword, 10);

    if (!hashedPwd) throw new Api500Error("Internal errors !");

    user.password = hashedPwd;

    const result = await user.save();

    return (
      result &&
      res.status(200).send({
        success: true,
        statusCode: 200,
        message: "Password updated successfully.",
      })
    );
  } catch (error: any) {
    next(error);
  }
}

async function checkOtpForForgotPwdChangeSystem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { otp, email } = req?.body;

    if (!otp) throw new Api400Error("Required otp in body !");

    if (otp.length <= 5 || otp?.length >= 7)
      throw new Api400Error("Otp must 6 digit!");

    if (!email) throw new Api400Error("Required email address in body !");

    const user = await User.findOne({ email });

    if (!user)
      throw new Api404Error(`Sorry we can't find any user with this ${email}!`);

    if (!user.otp) throw new Error("Internal error !");

    if (user.otp !== otp) throw new Api400Error("Invalid otp !");

    const now = new Date().getTime();
    const otpExTime = new Date(otp?.otpExTime).getTime();

    if (now >= otpExTime) {
      throw new Api400Error("Otp expired !");
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Redirecting...",
      data: {
        redirectUri: `forgot-pwd?action=forgotpwdform`,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function setNewPwdForForgotPwdChangeSystem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { email, password } = req.body;

    if (!email || !validEmail(email))
      throw new Api400Error("Required valid email address !");

    if (password.length < 5 || password.length > 8)
      throw new Api400Error("Password length should be 5 to 8 characters !");

    if (!validPassword(password) || typeof password !== "string")
      throw new Api400Error(
        "Password should contains at least 1 digit, lowercase letter, special character !"
      );

    const user = await User.findOne({ email });

    if (!user && typeof user !== "object")
      throw new Api404Error(`User not found!`);

    //  const hashedPwd = await bcrypt.hash(password, 10);

    user.password = password;
    user.otp = undefined;
    user.otpExTime = undefined;
    await user.save();

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Password updated successfully.",
    });
  } catch (error: any) {
    next(error);
  }
}

module.exports = {
  loginSystem,
  registrationSystem,
  accountVerifyByEmailSystem,
  passwordChangeSystem,
  sendOtpForForgotPwdChangeSystem,
  checkOtpForForgotPwdChangeSystem,
  setNewPwdForForgotPwdChangeSystem,
};
