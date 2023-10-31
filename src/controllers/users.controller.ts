import { NextFunction, Request, Response } from "express";
const User = require("../model/user.model");
const { BuyerMeta } = require("../model/usersmeta.model");
const { findUserByEmail } = require("../services/common.service");
const { Api400Error, Api404Error } = require("../errors/apiResponse");
const { generateUserDataToken } = require("../utils/generator");
const { ObjectId } = require("mongodb");
const NCache = require("../utils/NodeCache");

interface IShippingAddress {
  id: string;
  name: string;
  division: string;
  city: string;
  area: string;
  areaType: string;
  landmark: string;
  phoneNumber: string;
  postalCode: string;
  active?: boolean;
}

async function createShippingAddress(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { _id } = req.decoded;

    let body: any = req.body;

    if (!body || typeof body !== "object")
      throw new Api400Error("Required body !");

    if (!Object.values(body).some((e: any) => e !== null && e !== "")) {
      throw new Api400Error("Required all fields !");
    }

    const {
      name,
      division,
      city,
      area,
      areaType,
      landmark,
      phoneNumber,
      postalCode,
    } = body;

    let shippingAddressModel: IShippingAddress = {
      id: "spi_" + Math.floor(Math.random() * 100000000).toString(),
      name,
      division,
      city,
      area,
      areaType,
      landmark,
      phoneNumber,
      postalCode,
      active: false,
    };

    const result = await BuyerMeta.findOneAndUpdate(
      { userId: ObjectId(_id) },
      { $push: { shippingAddress: shippingAddressModel } },
      { upsert: true }
    );

    if (!result) throw new Error("Operation failed !");

    NCache.deleteCache(`${_id}_shippingAddress`);
    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Shipping address added successfully.",
    });
  } catch (error: any) {
    next(error);
  }
}

async function updateShippingAddress(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { _id } = req.decoded;
    const body: any = req.body;

    if (!body || typeof body !== "object")
      throw new Api400Error("Required body !");

    if (!Object.values(body).some((e: any) => e !== null && e !== "")) {
      throw new Api400Error("Required all fields !");
    }

    const {
      id,
      name,
      division,
      city,
      area,
      areaType,
      landmark,
      phoneNumber,
      postalCode,
      active,
    } = body;

    if (!id) throw new Api400Error("Required address id !");

    let shippingAddressModel: IShippingAddress = {
      id,
      name,
      division,
      city,
      area,
      areaType,
      landmark,
      phoneNumber,
      postalCode,
      active,
    };

    const result = await BuyerMeta.findOneAndUpdate(
      { userId: ObjectId(_id) },
      {
        $set: {
          "shippingAddress.$[i]": shippingAddressModel,
        },
      },
      { arrayFilters: [{ "i.id": id }] }
    );

    if (!result) throw new Error("Failed to update shipping address.");

    NCache.deleteCache(`${_id}_shippingAddress`);
    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Shipping address updated.",
    });
  } catch (error: any) {
    next(error);
  }
}

async function selectShippingAddress(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { _id } = req.decoded;

    let { id, active } = req.body;

    if (!id || typeof id !== "string")
      throw new Api400Error("Required address id !");

    active = active === true ? false : true;

    const result = await BuyerMeta.findOneAndUpdate(
      { userId: ObjectId(_id) },
      {
        $set: {
          "shippingAddress.$[j].active": false,
          "shippingAddress.$[i].active": active,
        },
      },
      {
        arrayFilters: [{ "j.id": { $ne: id } }, { "i.id": id }],
        multi: true,
      }
    );

    if (!result) throw new Error("Server error !");

    NCache.deleteCache(`${_id}_shippingAddress`);

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Default shipping address selected.",
    });
  } catch (error: any) {
    next(error);
  }
}

async function deleteShippingAddress(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { _id } = req.decoded;
    let id: any = req.params.id;

    if (!id || typeof id !== "string")
      throw new Api400Error("Required address id !");

    const result = await BuyerMeta.findOneAndUpdate(
      { userId: ObjectId(_id) },
      { $pull: { shippingAddress: { id } } }
    );

    if (!result) throw new Error("Internal issue !");

    NCache.deleteCache(`${_id}_shippingAddress`);
    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Address deleted successfully.",
      data: {},
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * @apiController --> Update Profile Data Controller
 * @apiMethod --> PUT
 * @apiRequired --> client email in header
 */
async function updateProfileData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const email: string = req.decoded.email;
    const { userEmail } = req.query;
    const body = req.body;

    if (userEmail !== email) {
      throw new Api400Error("Invalid email address !");
    }

    if (!body || typeof body === "undefined") {
      throw new Api400Error("Required body with request !");
    }

    const { fullName, dob, gender } = body;

    if (!fullName || typeof fullName !== "string")
      throw new Api400Error("Required full name !");

    if (!dob || typeof dob !== "string")
      throw new Api400Error("Required date of birth !");

    if (!gender || typeof gender !== "string")
      throw new Api400Error("Required gender !");

    interface IProfileData {
      fullName: string;
      dob: string;
      gender: string;
    }

    let profileModel: IProfileData = {
      fullName,
      dob,
      gender,
    };

    const result = await User.findOneAndUpdate(
      { email: email },
      { $set: profileModel },
      { upsert: true }
    );

    if (result) {
      return res
        .status(200)
        .send({ success: true, statusCode: 200, message: "Profile updated." });
    }
  } catch (error: any) {
    next(error);
  }
}

async function fetchAuthUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authEmail = req.decoded.email;

    // const ipAddress = req.socket?.remoteAddress;

    let user: any = await findUserByEmail(authEmail);

    if (!user || typeof user !== "object")
      throw new Api404Error("User not found !");

    const userDataToken = generateUserDataToken(user);

    if (!userDataToken) throw new Error("Internal issue !");

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Welcome " + user?.fullName,
      u_data: userDataToken,
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
async function fetchAddressBook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { _id } = req?.decoded;

    let shippingAddress: any[] = [];
    const buyerDataInCache = NCache.getCache(`${_id}_shippingAddress`);

    if (buyerDataInCache) {
      shippingAddress = buyerDataInCache;
    } else {
      const buyerMeta = await BuyerMeta.findOne({ userId: ObjectId(_id) });
      shippingAddress = buyerMeta?.shippingAddress;
      NCache.saveCache(`${_id}_shippingAddress`, shippingAddress);
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Data received.",
      data: {
        shippingAddress,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createShippingAddress,
  updateShippingAddress,
  selectShippingAddress,
  deleteShippingAddress,
  updateProfileData,
  fetchAuthUser,
  fetchAddressBook,
};
