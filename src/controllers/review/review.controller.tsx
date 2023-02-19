import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");

module.exports.addProductRating = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const productID = req.params.productID;
    const email = req.decoded.email;
    const body = req.body;
    const orderId = parseInt(body?.orderId);

    await db.collection("orders").updateOne(
      { user_email: email },
      {
        $set: {
          "orders.$[i].isRating": true,
        },
      },
      { upsert: true, arrayFilters: [{ "i.orderId": orderId }] }
    );

    const products = await db.collection("products").findOne({
      _id: ObjectId(productID),
      status: "active",
    });

    const point = parseInt(body?.rating_point);

    let ratingPoints =
      products?.rating && products?.rating.length > 0
        ? products?.rating
        : [
            { weight: 5, count: 0 },
            { weight: 4, count: 0 },
            { weight: 3, count: 0 },
            { weight: 2, count: 0 },
            { weight: 1, count: 0 },
          ];

    let counter: number = 0;
    let newRatingArray: any[] = [];

    for (let i = 0; i < ratingPoints.length; i++) {
      let count = ratingPoints[i].count;
      let weight = ratingPoints[i].weight;
      if (point === weight) {
        counter = count;
        count += 1;
      }
      newRatingArray.push({ weight, count: count });
    }

    let weightVal: number = 0;
    let countValue: number = 0;

    newRatingArray &&
      newRatingArray.length > 0 &&
      newRatingArray.forEach((rat: any) => {
        const multiWeight = parseInt(rat?.weight) * parseInt(rat?.count);
        weightVal += multiWeight;
        countValue += rat?.count;
      });
    const ava = weightVal / countValue;
    const average = parseFloat(ava.toFixed(1));

    let filters: any;
    let options: any;

    if (products?.rating && products?.rating.length > 0) {
      filters = {
        $set: {
          "rating.$[i].count": counter + 1,
          ratingAverage: average,
        },
        $push: { reviews: body },
      };
      options = { upsert: true, arrayFilters: [{ "i.weight": point }] };
    } else {
      filters = {
        $set: {
          rating: newRatingArray,
          ratingAverage: average,
        },
        $push: { reviews: body },
      };
      options = { upsert: true };
    }

    const result = await db.collection("products").updateOne(
      { _id: ObjectId(productID) },
      filters,
      options
    );

    if (result) {
      return res.status(200).send({ message: "Thanks for your review !" });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};
