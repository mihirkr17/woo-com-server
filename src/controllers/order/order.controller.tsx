import { Request, Response } from "express";
const { dbh } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const { updateProductStock } = require("../../utils/common");
const { orderModel } = require("../../model/order");

module.exports.setOrderHandler = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const productsCollection = dbh.db("Products").collection("product");
    const orderCollection = dbh.db("Products").collection("orders");
    const userCollection = dbh.db("Users").collection("user");

    const userEmail: string = req.headers.authorization || "";
    const verifiedEmail: string = req.decoded.email;
    const body: any = req.body;

    const products = await productsCollection.findOne({
      _id: ObjectId(body?.productId),
    });

    if (userEmail !== verifiedEmail)
      return res.status(401).send({ message: "Unauthorized access" });

    if (body) {
      if (products && products?.available > body?.quantity) {
        let model = orderModel(body);


        const result = await orderCollection.updateOne(
          { user_email: userEmail },
          { $push: { orders: model } },
          { upsert: true }
        );

        if (result) {
          await updateProductStock(body?.productId, body?.quantity, "dec");

          await userCollection.updateOne(
            { email: userEmail },
            { $unset: { myCartProduct: [] } }
          );
        }
        res.status(200).send(result && { message: "Order success" });
      } else {
        return res.status(400).send({
          message:
            "Order not taken because this product not available rights now!",
        });
      }
    } else {
      return res.status(400).send({ message: "Bad request!" });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.myOrder = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const orderCollection = dbh.db("Products").collection("orders");
    const email = req.params.email;
    res.send(await orderCollection.findOne({ user_email: email }));
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.removeOrder = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const orderCollection = dbh.db("Products").collection("orders");

    const orderUserEmail = req.params.email;
    const id = parseInt(req.params.orderId);
    const result = await orderCollection.updateOne(
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
    await dbh.connect();
    const orderCollection = dbh.db("Products").collection("orders");

    const userEmail = req.params.userEmail;
    const orderId = parseInt(req.params.orderId);
    const { status, cancel_reason, time_canceled, quantity, productId } =
      req.body;

    const result = await orderCollection.updateOne(
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
    await dbh.connect();
    const orderCollection = dbh.db("Products").collection("orders");
    const orderId: number = parseInt(req.params.orderId);
    const trackingId = req.params.trackingId;
    const userEmail: string = req.headers.authorization || "";
    res.status(200).send(
      (await orderCollection.updateOne(
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
    await dbh.connect();
    const orderCollection = dbh.db("Products").collection("orders");
    const seller = req.query.seller;
    let result: any;

    if (seller) {
      result = await orderCollection
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
