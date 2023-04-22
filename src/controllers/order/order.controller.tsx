import { NextFunction, Request, Response } from "express";
const OrderTableModel = require("../../model/orderTable.model");
const { update_variation_stock_available } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const email_service = require("../../services/email.service");



module.exports.myOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.params.email;
    const authEmail = req.decoded.email;

    if (email !== authEmail) {
      return res.status(401).send();
    }

    const orders = await OrderTableModel.find({ customerEmail: email }).sort({ _id: -1 });

    return res.status(200).send({ success: true, statusCode: 200, data: { module: { orders } } });
  } catch (error: any) {
    next(error);
  }
};

module.exports.removeOrder = async (req: Request, res: Response, next: any) => {
  try {

    const { email, orderID } = req.params;

    const result = await OrderTableModel.findOneAndDelete({ $and: [{ orderID }, { customerEmail: email }] });

    if (!result) throw new apiResponse.Api400Error("Order removed failed !");

    return res.status(200).send({ success: true, statusCode: 200, message: "Order Removed successfully" });

  } catch (error: any) {
    next(error);
  }
};

module.exports.cancelMyOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.params.email;

    const { cancelReason, orderID, orderItems } = req?.body;

    if (!orderID || typeof orderID !== "string") throw new apiResponse.Api400Error("Required order ID !");

    if (!cancelReason || typeof cancelReason !== "string") throw new apiResponse.Api400Error("Required cancel reason !");

    if (!orderItems || !Array.isArray(orderItems)) throw new apiResponse.Api400Error("Required order items information !");

    const timestamp = Date.now();

    let timePlan = {
      iso: new Date(timestamp),
      time: new Date(timestamp).toLocaleTimeString(),
      date: new Date(timestamp).toDateString(),
      timestamp: timestamp
    };

    const updateOrderStatusResult = await OrderTableModel.findOneAndUpdate({ $and: [{ orderID }, { customerEmail: email }] }, {
      $set: {
        orderStatus: "canceled",
        cancelReason: cancelReason,
        orderCanceledAT: timePlan,
        isCanceled: true
      }
    });

    if (!updateOrderStatusResult) throw new apiResponse.Api400Error("Order canceled request failed !");

    await Promise.all(orderItems.map(async (item: any) => await update_variation_stock_available("inc", item)));

    await email_service({
      to: email,
      subject: "Order canceled confirm",
      html: `
        <h3>
          Order canceled with ID : ${orderID}
        </h3>
        <br />
        <p>Cancel Reason: ${cancelReason.replace(/[_+]/gi, " ")}</p>
        <br />
        <ul style="padding: 10px;">
          ${orderItems?.map((item: any) => {
        return (
          `<li style="margin: 5px;">
            Title: ${item?.title}. <br />
            Price: ${item?.baseAmount} USD. <br />
            Qty: ${item?.quantity} pcs.
          </li>`
        )
      })}
        </ul>`
    });

    return res.status(200).send({ success: true, statusCode: 200, message: "Order canceled successfully" });
  } catch (error: any) {
    next(error);
  }
};


