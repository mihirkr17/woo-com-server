import { NextFunction, Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const { updateProductStock } = require("../../utils/common");
const { orderModel } = require("../../templates/order.template");
const Product = require("../../model/product.model");
const User = require("../../model/user.model");
const Order = require("../../model/order.model");


module.exports.myOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await dbConnection();
    const email = req.params.email;
    const authEmail = req.decoded.email;

    if (email !== authEmail) {
      return res.status(401).send();
    }

    let result = await Order.aggregate([
      { $match: { $and: [{ user_email: email }] } },
      { $unwind: { path: "$orders" } },
      { $replaceRoot: { newRoot: "$orders" } }
    ]);

    res.status(200).send({ success: true, statusCode: 200, data: { module: { orders: result } } });
  } catch (error: any) {
    next(error);
  }
};

module.exports.removeOrder = async (req: Request, res: Response, next: any) => {
  try {
    const db = await dbConnection();

    const orderUserEmail = req.params.email;
    const id = parseInt(req.params.orderId);
    const result = await db
      .collection("orders")
      .updateOne(
        { user_email: orderUserEmail },
        { $pull: { orders: { orderId: id } } }
      );

    res.status(200).send({ result, message: "Order Removed successfully" });
  } catch (error: any) {
    next(error);
  }
};

module.exports.cancelMyOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userEmail = req.params.userEmail;
    const { cancel_reason, orderID } = req.body;

    const timestamp = Date.now();

    let cancelTime = {
      iso: new Date(timestamp),
      time: new Date(timestamp).toLocaleTimeString(),
      date: new Date(timestamp).toDateString(),
      timestamp: timestamp
    }

    const result = await Order.findOneAndUpdate(
      { user_email: userEmail },
      {
        $set: {
          "orders.$[i].orderStatus": "canceled",
          "orders.$[i].cancelReason": cancel_reason,
          "orders.$[i].orderCanceledAT": cancelTime,
        },
      },
      { arrayFilters: [{ "i.orderID": orderID }], upsert: true }
    );

    if (result) {
      let existOrder = await Order.aggregate([
        { $match: { user_email: userEmail } },
        { $unwind: { path: "$orders" } },
        {
          $replaceRoot: { newRoot: "$orders" }
        },
        {
          $match: { $and: [{ orderID: orderID }] }
        }
      ]);

      existOrder = existOrder[0];

      let products = await Product.aggregate([
        { $match: { $and: [{ _LID: existOrder?.listingID }] } },
        { $unwind: { path: "$variations" } },
        {
          $project: {
            variations: 1
          }
        },
        { $match: { $and: [{ "variations._VID": existOrder?.variationID }] } },
      ]);
      products = products[0];


      let availableProduct = products?.variations?.available;
      let restAvailable = availableProduct + existOrder?.quantity;
      let stock = restAvailable <= 1 ? "out" : "in";

      await Product.findOneAndUpdate(
        { _id: ObjectId(existOrder?.productID) },
        {
          $set: {
            "variations.$[i].available": restAvailable,
            "variations.$[i].stock": stock
          }
        },
        { arrayFilters: [{ "i._VID": existOrder?.variationID }] }
      );
    }

    res.send({ success: true, statusCode: 200, message: "Order canceled successfully" });
  } catch (error: any) {
    next(error);
  }
};


