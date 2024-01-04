// src/controllers/buyer.auth.controller.ts

import { NextFunction, Request, Response } from "express";
const User = require("../model/CUSTOMER_TBL");
const {
  Error400,
  Error500,
  Error404,
} = require("../res/response");
const bcrypt = require("bcrypt");
const smtpSender = require("../services/email.service");
const { verify_email_html_template } = require("../templates/email.template");
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

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function userRegistrationController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let body = req.body;

    let existUser = await countUserByEmail(body?.email);

    if (existUser >= 1)
      throw new Error400(
        "User already exists, Please try another email address !"
      );

    body["authProvider"] = "system";
    const verifyToken = generateVerificationToken(body);

    const emailResult = await smtpSender({
      to: body?.email,
      subject: "Verify email address",
      html: verify_email_html_template(verifyToken),
    });

    if (!emailResult?.response)
      throw new Error400("Verification code not send to your email !");

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: `Thanks for your information. Verification code send to this ${body?.email}`,
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
async function userLoginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email: inputEmail, password: inputPassword } = req.body;

    let user = await User.findOne({ email: inputEmail }); //findUserByEmail(inputEmail);

    if (!user) throw new Error400(`User with ${inputEmail} not found!`);

    const { email, verified, accountStatus, fullName } = user || {};

    const matchedPwd = await user.comparePassword(inputPassword);

    if (!matchedPwd) throw new Error400("Password didn't matched !");

    console.log(user);

    if (!verified || accountStatus === "Inactive") {
      const verifyToken = generateVerificationToken({ email });

      const info = await smtpSender({
        to: email,
        subject: "Verify email address",
        html: verify_email_html_template(verifyToken, fullName),
      });

      if (!info?.response) throw new Error("Internal error !");

      return res.status(200).send({
        success: true,
        statusCode: 200,
        returnEmail: email,
        message: `Verification code was sent to ${email}. Please verify your account.`,
      });
    }

    const loginToken = generateJwtToken(user);

    const userDataToken = generateUserDataToken(user);

    if (!loginToken || !userDataToken)
      throw new Error("Login failed due to internal issue !");

    // if all operation success then return the response
    return res.status(200).send({
      success: true,
      statusCode: 200,
      name: "Login",
      message: "Login success",
      uuid: user?._uuid,
      u_data: userDataToken,
      token: loginToken,
      role: user?.role,
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
async function userAccountVerifyByEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { email } = req.decoded;

    let user = await findUserByEmail(email);

    if (!user) throw new Error400(`Sorry account with ${email} not found`);

    if (user.verified && user.accountStatus === "Active")
      return res.status(200).send({
        success: true,
        statusCode: 200,
        message: "Congratulation your account already verified",
      });

    user.verified = true;
    user.accountStatus = "Active";

    await user.save();

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: `Congrats! Account with ${email} verification complete.`,
      returnEmail: email,
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
async function generateNewVerifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { email } = req.query;

    if (!email) throw new Error400("Required email address !");

    if (!validEmail(email))
      throw new Error400("Required valid email address !");

    let user = await findUserByEmail({ email });

    if (!user) throw new Error400("Sorry user not found !");

    if (user?.verificationCode || user?.accountStatus === "Inactive") {
      user.verificationCode = generateSixDigitNumber();
      user.verificationExpiredAt = generateExpireTime();

      let updateUser = await user.save();

      if (updateUser?.verificationCode) {
        const info = await smtpSender({
          to: user?.email,
          subject: "Verify email address",
          html: verify_email_html_template(updateUser?.verificationCode),
        });

        if (info?.response) {
          return res.status(200).send({
            success: true,
            statusCode: 200,
            returnEmail: updateUser?.email,
            verificationExpiredAt: updateUser?.verificationExpiredAt,
            message: `Verification code is sent to ${updateUser?.email}`,
          });
        }

        throw new Error500("Internal error !");
      }
    }

    throw new Error400(`Your account with ${email} already active.`);
  } catch (error: any) {
    next(error);
  }
}

/**
 * @controller --> registration verify by token
 */
async function userEmailVerificationController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { verificationCode, verificationExpiredAt, email } = req.body;

    if (!verificationCode)
      throw new Error400("Required verification code !");

    if (verificationCode.length >= 7 || verificationCode <= 5)
      throw new Error400("Verification code should be 6 digits !");

    if (new Date(verificationExpiredAt) < new Date() === true)
      throw new Error400("Session expired ! Please resend code ..");

    let user = await User.findOne({ $and: [{ verificationCode }, { email }] });

    if (!user) throw new Error400("Session expired !");

    user.verificationCode = undefined;
    user.verificationExpiredAt = undefined;
    user.accountStatus = "Active";

    const result = await user.save();

    return (
      result &&
      res.status(200).send({
        success: true,
        statusCode: 200,
        message: "Verification successful.",
        returnEmail: email,
      })
    );
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
async function changePasswordController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { email } = req.decoded;

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      throw new Error400(`Required old password and new password !`);

    if (newPassword && typeof newPassword !== "string")
      throw new Error400("Password should be string !");

    if (newPassword.length < 5 || newPassword.length > 8)
      throw new Error400("Password length should be 5 to 8 characters !");

    if (!validPassword(newPassword))
      throw new Error400(
        "Password should contains at least 1 digit, lowercase letter, special character !"
      );

    // find user in db by email
    let user = await User.findOne({ email: email });

    if (!user && typeof user !== "object")
      throw new Error404(`User not found !`);

    const comparedPassword = await bcrypt.compare(oldPassword, user?.password);

    if (!comparedPassword) {
      throw new Error400("Password didn't match !");
    }

    let hashedPwd = await bcrypt.hash(newPassword, 10);

    if (!hashedPwd) throw new Error500("Internal errors !");

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

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function checkUserAuthenticationByEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { email } = req?.body;

    if (!email || !validEmail(email))
      throw new Error400("Required valid email address !");

    const user = await User.findOne({ email });

    if (!user || typeof user === "undefined")
      throw new Error404(`Sorry user not found with this ${email}`);

    const securityCode = generateSixDigitNumber();
    const lifeTime = 300000;

    const info = await smtpSender({
      to: email, // the user email
      subject: "Reset your WooKart Password",
      html: `<p>Your Security Code is <b style="font-size: 1.5rem">${securityCode}</b> and expire in 5 minutes.</p>`,
    });

    if (!info?.response)
      throw new Error500(
        "Sorry ! Something wrong in your email. please provide valid email address."
      );

    res.cookie("securityCode", securityCode, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: lifeTime,
    });

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "We have send otp to your email..",
      lifeTime,
      email,
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
async function checkUserForgotPwdSecurityKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const sCode = req.cookies.securityCode;

    if (!sCode) throw new Error400("Security code is expired !");

    if (!req.body || typeof req.body === "undefined")
      throw new Error400("Required body !");

    const { email, securityCode } = req.body;

    if (!email) throw new Error400("Required email !");

    if (!securityCode) throw new Error400("Required security code !");

    const user = await User.findOne({ email });

    if (!user || typeof user === "undefined")
      throw new Error404("Sorry user not found with this " + email);

    if (securityCode !== sCode)
      throw new Error400("Invalid security code !");

    res.clearCookie("securityCode");

    const life = 120000;
    res.cookie("set_new_pwd_session", securityCode, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: life,
    });

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Success. Please set a new password.",
      data: { email: user?.email, securityCode, sessionLifeTime: life },
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
async function userSetNewPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { set_new_pwd_session } = req.cookies;

    if (!set_new_pwd_session)
      throw new Error400("Sorry ! your session is expired !");

    const { email, password, securityCode } = req.body;

    if (securityCode !== set_new_pwd_session)
      throw new Error400("Invalid security code !");

    if (!email || !validEmail(email))
      throw new Error400("Required valid email address !");

    if (password.length < 5 || password.length > 8)
      throw new Error400("Password length should be 5 to 8 characters !");

    if (!validPassword(password) || typeof password !== "string")
      throw new Error400(
        "Password should contains at least 1 digit, lowercase letter, special character !"
      );

    const user = await User.findOne({ email });

    if (!user && typeof user !== "object")
      throw new Error404(`User not found!`);

    const hashedPwd = await bcrypt.hash(password, 10);

    const result = hashedPwd
      ? await User.findOneAndUpdate(
          { email },
          { $set: { password: hashedPwd } },
          { upsert: true }
        )
      : false;

    res.clearCookie("set_new_pwd_session");

    if (!result) throw new Error500("Something wrong in server !");

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
  userRegistrationController,
  userLoginController,
  userAccountVerifyByEmail,
  generateNewVerifyToken,
  userEmailVerificationController,
  changePasswordController,
  checkUserAuthenticationByEmail,
  checkUserForgotPwdSecurityKey,
  userSetNewPassword,
};
