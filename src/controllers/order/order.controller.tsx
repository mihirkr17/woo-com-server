import { NextFunction, Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
const Product = require("../../model/product.model");
const Order = require("../../model/order.model");
const { order_status_updater, update_variation_stock_available } = require("../../services/common.services");


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

    const body = req.body;

    const { cancelReason, orderID } = body;

    if (!orderID) throw new Error("Required order ID !");

    if (!cancelReason) throw new Error("Required cancel reason !");

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

    if (existOrder) {
      await order_status_updater({ type: "canceled", cancelReason, customerEmail: existOrder?.customerEmail, trackingID: existOrder?.trackingID });
      await update_variation_stock_available("inc", existOrder);
    }

    return res.status(200).send({ success: true, statusCode: 200, message: "Order canceled successfully" });
  } catch (error: any) {
    next(error);
  }
};


