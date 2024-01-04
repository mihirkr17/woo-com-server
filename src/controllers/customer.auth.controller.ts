import { NextFunction, Request, Response } from "express";

import {
  IShippingAddress,
  IBuyerProfileUpdate,
} from "../interfaces/users.interface";
const Customer = require("../model/CUSTOMER_TBL");
const { ObjectId } = require("mongodb");
const NCache = require("../utils/NodeCache");

const { Error400, Error404 } = require("../res/response");
const smtpSender = require("../services/email.service");
const {
  verify_email_html_template,
  send_six_digit_otp_template,
} = require("../templates/email.template");
const {
  generateSixDigitNumber,
  generateJwtToken,
  generateUserDataToken,
  generateVerificationToken,
} = require("../utils/generator");

const {
  validEmail,
  validPassword,
  validDigit,
  validBDPhoneNumber,
} = require("../utils/validator");

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

    let user = await Customer.findOne({ email: inputEmail });

    if (!user) throw new Error400(`User with ${inputEmail} not found!`);

    const { email, verified, accountStatus, fullName, devices } = user || {};

    const matchedPwd = await user.comparePassword(inputPassword);

    if (!matchedPwd) throw new Error400("Password didn't matched !");

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
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function registrationSystem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let body = req.body;
    const requiredRoles: string[] = ["buyer", "supplier", "admin"];

    const origin =
      req.headers.referer || req.headers.origin || req.headers.host;

    const headersRole: any = req.headers.role || "";

    let existUser = await Customer.countDocuments({ email: body?.email });

    if (existUser >= 1)
      throw new Error400(
        "User already exists, Please try another email address !"
      );

    const verifyToken = generateVerificationToken({ email: body?.email });

    const emailResult = await smtpSender({
      to: body?.email,
      subject: "Verify email address",
      html: verify_email_html_template(
        verifyToken,
        body?.fullName,
        req?.appUri
      ),
    });

    if (!emailResult?.response)
      throw new Error400("Verification code not send to your email !");

    if (headersRole === "buyer") {
      body["role"] = "CUSTOMER";
      body["idFor"] = "buy";
    }
    if (headersRole === "SUPPLIER") {
      body["role"] = "SUPPLIER";
      body["idFor"] = "sell";
    }
    if (headersRole === "admin") {
      body["role"] = "ADMIN";
      body["idFor"] = "administration";
    }

    const newUser = new Customer(body);

    await newUser.save();

    if (headersRole === "buyer") {
      const newCustomer = new Customer({
        userId: newUser?._id,
      });

      await newCustomer.save();
    }

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: `Thanks for your information. Verification code send to ${body?.email}`,
    });
  } catch (error: any) {
    next(error);
  }
}

module.exports = { loginSystem, registrationSystem };
