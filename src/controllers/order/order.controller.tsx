import { NextFunction, Request, Response } from "express";
const Product = require("../../model/product.model");
const Order = require("../../model/order.model");
const OrderTableModel = require("../../model/orderTable.model");
const { order_status_updater, update_variation_stock_available } = require("../../services/common.service");


module.exports.myOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.params.email;
    const authEmail = req.decoded.email;

    if (email !== authEmail) {
      return res.status(401).send();
    }

    let result = await OrderTableModel.aggregate([
      { $match: { $and: [{ customerEmail: email }] } },
      // { $unwind: { path: "$items" } },
      // {
      //   $group: {
      //     _id: "$orderPaymentID",
      //     orderID: {$first: "$orderID"},
      //     totalAmount: { $sum: "$items.baseAmount" },
      //     paymentIntentID: { $first: "$paymentIntentID" },
      //     customerEmail: { $first: "$customerEmail" },
      //     paymentMethodID: { $first: "$paymentMethodID" },
      //     paymentStatus: { $first: "$paymentStatus" },
      //     orderStatus: { $first: "$orderStatus" },
      //     paymentMode: { $first: "$paymentMode" },
      //     orderAT: { $first: "$orderAT" },
      //     items: {
      //       $push: "$items"
      //     }
      //   }
      // },
      // { $unwind: { path: "$orders" } },
      // { $replaceRoot: { newRoot: "$orders" } },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).send({ success: true, statusCode: 200, data: { module: { orders: result } } });
  } catch (error: any) {
    next(error);
  }
};

module.exports.removeOrder = async (req: Request, res: Response, next: any) => {
  try {

    const orderUserEmail = req.params.email;
    const id = parseInt(req.params.orderId);

    const result = await Order.findOneAndUpdate(
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


