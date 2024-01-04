import { NextFunction, Request, Response } from "express";
const Supplier = require("../model/SUPPLIER_TBL");
const { ObjectId } = require("mongodb");
const NCache = require("../utils/NodeCache");
const { Error400, Error404, Error503, Success } = require("../res/response");
const Joi = require("joi");
const smtpSender = require("../services/email.service");

const { verify_email_html_template } = require("../templates/email.template");

const {
  generateJwtToken,
  generateSupplierDataToken,
  generateExpireTime,
  generateSixDigitNumber,
  generateUserDataToken,
  generateVerificationToken,
} = require("../utils/generator");

const loginValidationSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
    .required(),
  password: Joi.string().required(),
});

/**
 * [async description]
 *
 * @param   {Request}       req   [req description]
 * @param   {Response}      res   [res description]
 * @param   {NextFunction}  next  [next description]
 *
 * @return  {[type]}              [return description]
 */
async function supplierLogin(req: Request, res: Response, next: NextFunction) {
  try {
    // Getting email and password from client
    const { email: inputEmail, password: inputPassword } = req.body as {
      email: string;
      password: string;
    };

    const { error, value } = await loginValidationSchema.validate({
      email: inputEmail,
      password: inputPassword,
    });

    if (error)
      return res.status(400).json({ success: false, message: error?.details });

    const supplier = await Supplier.findOne({
      "credentials.email": inputEmail,
    });

    if (!supplier) throw new Error404(`Account with ${inputEmail} not found!`);

    // comparing input password with hash password
    const passwordMatched = await supplier.comparedPassword(inputPassword);

    if (!passwordMatched) throw new Error400("Password didn't matched !");

    const {
      credentials,
      _id,
      storeInformation,
      personalInformation,
      role,
      emailVerified,
      emailVerifyToken,
      status,
      fulfilled,
    } = supplier;

    if (!emailVerified || emailVerifyToken) {
      // generate verify token using jwt
      const newVerifyToken = generateVerificationToken({
        email: inputEmail,
        clientOrigin: req?.clientOrigin,
      });

      if (!newVerifyToken) throw new Error503("Service unavailable!");

      // verify route
      const redirectUri = `${req?.appUri}api/v1/supplier/auth/verify-email?token=${newVerifyToken}`;

      supplier.emailVerifyToken = newVerifyToken;
      supplier.emailVerified = false;

      await supplier.save();

      await smtpSender({
        to: inputEmail,
        subject: "Verify email address",
        html: verify_email_html_template(
          personalInformation?.fullName,
          redirectUri
        ),
      });

      return res.status(200).json({
        success: true,
        message: `Verification email send to ${inputEmail}`,
      });
    }

    const token = generateJwtToken({
      _id,
      email: credentials?.email,
      storeName: storeInformation?.companyName,
      fullName: personalInformation?.fullName,
      contactEmail: personalInformation?.email,
      role,
    });

    const userDataToken = generateSupplierDataToken({
      _id,
      email: credentials?.email,
      storeName: storeInformation?.companyName,
      personalInformation,
      status,
      fulfilled,
      role,
    });

    return new Success(res, {
      message: "Login success...",
      data: {
        action: "LOGIN_SUCCESS",
        loginToken: token,
        persistenceToken: userDataToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function supplierRegistration(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { credentialEmail, credentialPassword, credentialName } = req.body;

    const supplier = await Supplier.findOne({
      "credentials.email": credentialEmail,
    });

    if (supplier)
      throw new Error400(`Account with ${credentialEmail} already present!`);

    // generate verify token using jwt
    const verifyToken = generateVerificationToken({ email: credentialEmail });

    if (!verifyToken) throw new Error503("Service unavailable!");

    // new supplier instance
    let newSupplier = new Supplier({
      credentials: {
        name: credentialName,
        email: credentialEmail,
        password: credentialPassword,
      },
      emailVerified: false,
      emailVerifyToken: verifyToken,
      role: "SUPPLIER",
      status: "aspiring",
      fulfilled: false,
      statusHistory: [
        {
          name: "aspiring",
          at: new Date(Date.now()),
        },
      ],
    });

    await newSupplier.save();

    const redirectUri = `${req?.appUri}api/v1/supplier/auth/verify-email?token=${verifyToken}`;

    await smtpSender({
      to: credentialEmail,
      subject: "Verify email address",
      html: verify_email_html_template(credentialName, redirectUri),
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        "Account created successfully. A verification email send to your email. Please verify...",
    });
  } catch (error) {
    next(error);
  }
}

async function supplierInformationConnect(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { supplierId } = req?.params;
    const { _id } = req?.decoded;

    const STATUS = "under review";

    if (supplierId !== _id) throw new Error400("Invalid id!");

    const {
      storeName,
      taxIdentificationNumber,
      registrationNumber,
      contactFullName,
      contactEmail,
      contactGender,
      postalCode,
      latitude,
      longitude,
      addressLabel,
      countryCode,
      contactPhone,
      landmark,
      docType,
      docId,
    } = req.body;

    let supplier = await Supplier.findOne({
      $and: [{ _id: ObjectId(supplierId) }, { status: "aspiring" }],
    });

    if (!supplier) throw new Error503("Service unavailable!");

    const { statusHistory } = supplier;

    let newStatusHistory = statusHistory || [];

    newStatusHistory.push({ name: STATUS, at: new Date(Date.now()) });

    const file = req.file as any;

    if (!file) {
      throw new Error400("No files uploaded");
    }

    const docImageLink: any = "/supplier-verification-data/" + file.filename;

    let newSupplier = {
      storeInformation: {
        storeName,
        taxIdentificationNumber,
        registrationNumber,
      },
      personalInformation: {
        gender: contactGender,
        fullName: contactFullName,
        email: contactEmail,
        countryCode,
        phone: contactPhone,
        address: {
          label: addressLabel,
          postalCode,
          latitude,
          longitude,
          landmark,
        },
      },
      documents: {
        docImageLink,
        docType,
        docId,
      },
      status: STATUS,
      statusHistory: newStatusHistory,
    };

    await Supplier.updateOne(
      {
        $and: [{ fulfilled: false }, { _id: ObjectId(_id) }],
      },
      { ...newSupplier },
      {
        upsert: true,
      }
    );

    return new Success(res, {
      message:
        "Seller information added successfully. Your account under review.",
    });
  } catch (error: any) {
    next(error);
  }
}

// email validation
async function supplierCredentialEmailValidation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, clientOrigin } = req.decoded;

    const supplier = await Supplier.findOne({
      $and: [{ "credentials.email": email }, { emailVerified: false }],
    });

    const clientUrl = `${clientOrigin}/email-confirmation?e=${email}`;

    if (!supplier) return res.redirect(`${clientUrl}`);

    supplier.emailVerifyToken = undefined;
    supplier.emailVerified = true;

    await supplier.save();

    return res.redirect(`${clientUrl}`);
  } catch (error: any) {
    next(error);
  }
}

async function getAccountSystem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email } = req?.decoded;

    const supplier = await Supplier.findOne({
      "credentials.email": email,
    });

    if (!supplier) throw new Error404(`Account with ${email} not found!`);

    // comparing input password with hash password
    const {
      credentials,
      _id,
      storeInformation,
      personalInformation,
      role,
      status,
      fulfilled,
    } = supplier;

    const userDataToken = generateSupplierDataToken({
      _id,
      email: credentials?.email,
      storeName: storeInformation?.companyName,
      personalInformation,
      status,
      fulfilled,
      role,
    });

    return new Success(res, {
      message: "Account Refreshed.",
      data: {
        action: "ACCOUNT_REFRESHED",
        persistenceToken: userDataToken,
      },
    });
  } catch (error: any) {
    next(error);
  }
}
module.exports = {
  supplierLogin,
  supplierRegistration,
  supplierInformationConnect,
  supplierCredentialEmailValidation,
  getAccountSystem,
};
