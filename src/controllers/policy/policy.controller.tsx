import { NextFunction, Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const apiResponse = require("../../errors/apiResponse");

module.exports.privacyPolicy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await dbConnection();

    res.status(200).send(await db.collection("privacy-policy").findOne({}));
  } catch (error: any) {
    next(error);
  }
};

module.exports.updatePolicy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await dbConnection();

    const policyId: string = req.params.policyId;
    const body = req.body;

    const result = await db.collection("privacy-policy").updateOne({ _id: ObjectId(policyId) }, { $set: body }, { upsert: true });

    if (result) {
      return res.status(200).send({ success: true, statusCode: 200, message: "Policy updated successfully" });
    } else {
      throw new apiResponse.Api500Error("Update failed !");
    }
  } catch (error: any) {
    next(error);
  }
};
