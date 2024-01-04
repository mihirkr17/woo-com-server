import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const { Error500 } = require("../res/response");
const PrivacyPolicy = require("../model/privacyPolicy.model");
const NodeCache = require("../utils/NodeCache");

module.exports.privacyPolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pCache = NodeCache.getCache(`privacyPolicy`);
    let privacyPolicy;

    if (pCache) {
      privacyPolicy = pCache;
    } else {
      privacyPolicy = await PrivacyPolicy.findOne({});
      NodeCache.saveCache(`privacyPolicy`, privacyPolicy);
    }

    res
      .status(200)
      .send({ success: true, statusCode: 200, data: privacyPolicy });
  } catch (error: any) {
    next(error);
  }
};

module.exports.updatePolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const policyId: string = req.params.policyId;
    const body = req.body;

    const result = await PrivacyPolicy.findOneAndUpdate(
      { _id: ObjectId(policyId) },
      { $set: body },
      { upsert: true }
    );

    if (result) {
      NodeCache.deleteCache(`privacyPolicy`);
      return res
        .status(200)
        .send({
          success: true,
          statusCode: 200,
          message: "Policy updated successfully",
        });
    } else {
      throw new Error500("Update failed !");
    }
  } catch (error: any) {
    next(error);
  }
};
