import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");

module.exports.privacyPolicy = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    res.status(200).send(await db.collection("privacy-policy").findOne({}));
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.updatePolicy = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const policyId: string = req.params.policyId;
    const body = req.body;
    const result = await db
      .collection("privacy-policy")
      .updateOne({ _id: ObjectId(policyId) }, { $set: body }, { upsert: true });

    if (result) {
      return res.status(200).send({ message: "Policy updated successfully" });
    } else {
      return res.status(400).send({ message: "Update failed" });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};
