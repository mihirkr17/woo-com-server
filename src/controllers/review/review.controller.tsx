import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const Product = require("../../model/product.model");
const Order = require("../../model/order.model");

module.exports.addProductRating = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const productID = req.params.productID;
    const email = req.decoded.email;
    const body = req.body;
    const orderId = parseInt(body?.orderId);

    await Order.findOneAndUpdate(
      { user_email: email },
      {
        $set: {
          "orders.$[i].isRated": true,
        },
      },
      { arrayFilters: [{ "i.orderID": orderId }], upsert: true }
    );

    const product = await Product.findOne({ _id: ObjectId(productID) });

    const point = parseInt(body?.rating_point);

    let ratingPoints =
      product?.rating && product?.rating.length > 0
        ? product?.rating
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

    if (product?.rating && product?.rating.length > 0) {
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

    const result = await Product.findOneAndUpdate(
      { _id: ObjectId(productID) },
      filters,
      options
    );

    if (result) {
      return res.status(200).send({ success: true, statusCode: 200, message: "Thanks for your review !" });
    }
  } catch (error: any) {
    next(error);
  }
};
