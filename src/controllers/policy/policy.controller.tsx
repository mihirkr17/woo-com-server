import { Request, Response } from "express";
const { dbh } = require("../../utils/db");
const { ObjectId } = require("mongodb");

module.exports.privacyPolicy = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const productPolicy = dbh.db("Products").collection("policy");
    res.status(200).send(await productPolicy.findOne({}));
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.updatePolicy = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const productPolicy = dbh.db("Products").collection("policy");
    const policyId: string = req.params.policyId;
    const body = req.body;
    const result = await productPolicy.updateOne(
      { _id: ObjectId(policyId) },
      { $set: body },
      { upsert: true }
    );

    if (result) {
      return res.status(200).send({ message: "Policy updated successfully" });
    } else {
      return res.status(400).send({ message: "Update failed" });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};
