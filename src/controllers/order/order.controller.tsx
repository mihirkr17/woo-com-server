import { NextFunction, Request, Response } from "express";
const { update_variation_stock_available, order_status_updater } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const email_service = require("../../services/email.service");
const NodeCache = require("../../utils/NodeCache");
const Order = require("../../model/order.model");


module.exports.myOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params;
    const { email: authEmail } = req.decoded;

    let orders: any[];

    if (email !== authEmail) {
      return res.status(401).send();
    }

    let cacheMyOrder = NodeCache.getCache(`${authEmail}_myOrders`);

    if (cacheMyOrder) {
      orders = cacheMyOrder;
    } else {
      orders = await Order.find({ "customer.email": email }).sort({ _id: -1 });
      NodeCache.saveCache(`${authEmail}_myOrders`, orders);
    }

    return res.status(200).send({ success: true, statusCode: 200, data: { module: { orders } } });
  } catch (error: any) {
    next(error);
  }
};

module.exports.removeOrder = async (req: Request, res: Response, next: any) => {
  try {

    const { email, orderID } = req.params;

    const result = await Order.findOneAndDelete({ $and: [{ order_id: orderID }, { "customer.email": email }] });

    if (!result) throw new apiResponse.Api400Error("Order removed failed !");

    return res.status(200).send({ success: true, statusCode: 200, message: "Order Removed successfully" });

  } catch (error: any) {
    next(error);
  }
};

module.exports.cancelMyOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.params.email;

    const { cancelReason, orderID, product } = req?.body;

    if (!orderID || typeof orderID !== "string") throw new apiResponse.Api400Error("Required order ID !");

    if (!cancelReason || typeof cancelReason !== "string") throw new apiResponse.Api400Error("Required cancel reason !");

    if (!product) throw new apiResponse.Api400Error("Required order items information !");

    // calling parallel api 
    const [orderStatusResult, variationResult, emailSendingResult] = await Promise.all([
      order_status_updater({ customerEmail: email, sellerEmail: product?.sellerEmail, orderID, type: "canceled", cancelReason }),

      update_variation_stock_available("inc", product),

      email_service({
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
            <li style="margin: 5px;">
              Title: ${product?.title}. <br />
              Total: ${product?.finalAmount} Tk. <br />
              Qty: ${product?.quantity} pcs.
            </li>
          </ul>`
      })
    ]);

    return orderStatusResult && res.status(200).send({ success: true, statusCode: 200, message: "Order canceled successfully" });
  } catch (error: any) {
    next(error);
  }
};


