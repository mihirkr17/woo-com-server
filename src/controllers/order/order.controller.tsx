import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const { updateProductStock } = require("../../utils/common");
const { orderModel } = require("../../model/order");

module.exports.setOrderHandler = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userEmail: string = req.headers.authorization || "";
    const verifiedEmail: string = req.decoded.email;
    const body: any = req.body;

    if (userEmail !== verifiedEmail) {
      return res.status(401).send({ error: "Unauthorized access" });
    }

    if (!body || typeof body === "undefined") {
      return res.status(400).send({
        success: false,
        statusCode: 400,
        error: "Something went wrong !",
      });
    }

    const products = await db.collection("products").findOne({
      _id: ObjectId(body?.productId),
    });

    if (!products || typeof products === "undefined") {
      return res.status(400).send({
        success: false,
        statuscode: 400,
        error: "Sorry! Can't place this order",
      });
    }

    if (products?.available < body?.quantity && products.stock !== "in") {
      return res.status(400).send({
        success: false,
        statuscode: 400,
        error:
          "Sorry! Order not taken because this product not available rights now!",
      });
    }

    let model = orderModel(body);

    const result = await db
      .collection("orders")
      .updateOne(
        { user_email: userEmail },
        { $push: { orders: model } },
        { upsert: true }
      );

    if (result) {
      await updateProductStock(body?.productId, body?.quantity, "dec");

      await db
        .collection("users")
        .updateOne({ email: userEmail }, { $unset: { myCartProduct: [] } });
      res.status(200).send(result && { message: "Order success" });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.myOrder = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();
    const email = req.params.email;
    res.send(await db.collection("orders").findOne({ user_email: email }));
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.removeOrder = async (req: Request, res: Response) => {
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
    res.status(500).send({ message: error?.message });
  }
};

module.exports.cancelMyOrder = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userEmail = req.params.userEmail;
    const orderId = parseInt(req.params.orderId);
    const { status, cancel_reason, time_canceled, quantity, productId } =
      req.body;

    const result = await db.collection("orders").updateOne(
      { user_email: userEmail },
      {
        $set: {
          "orders.$[i].status": status,
          "orders.$[i].cancel_reason": cancel_reason,
          "orders.$[i].time_canceled": time_canceled,
        },
      },
      { arrayFilters: [{ "i.orderId": orderId }] }
    );

    if (result) {
      await updateProductStock(productId, quantity, "inc");
    }

    res.send({ result, message: "Order canceled successfully" });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.dispatchOrderRequest = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const orderId: number = parseInt(req.params.orderId);
    const trackingId = req.params.trackingId;
    const userEmail: string = req.headers.authorization || "";
    res.status(200).send(
      (await db.collection("orders").updateOne(
        { user_email: userEmail },
        {
          $set: {
            "orders.$[i].status": "dispatch",
          },
        },
        {
          arrayFilters: [{ "i.orderId": orderId, "i.trackingId": trackingId }],
        }
      )) && { message: "Successfully order dispatched" }
    );
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.manageOrders = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();
    const seller = req.query.seller;
    let result: any;

    if (seller) {
      result = await db
        .collection("orders")
        .aggregate([
          { $unwind: "$orders" },
          {
            $match: {
              $and: [{ "orders.seller": seller }],
            },
          },
        ])
        .toArray();
    }

    res.status(200).send(result);
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};
