import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
const { order_status_updater, update_variation_stock_available } = require("../../services/common.service");
const Product = require("../../model/product.model");
const OrderTableModel = require("../../model/orderTable.model");

module.exports.manageOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const filters: any = req.query.filters;
    const storeName = req.params.storeName;
    const uuid = req.decoded._uuid;
    const email = req.decoded.email;
    let result: any;

    let f: any = {};

    if (filters) {
      f = { $and: [{ "seller.store": storeName }, { "seller.email": email }, { orderStatus: filters }] }
    } else {
      f = { $and: [{ "seller.store": storeName }, { "seller.email": email }] }
    }

    const orders = await OrderTableModel.find(f).sort({ _id: -1 });

    let orderCounter = await OrderTableModel.aggregate([
      { $match: { $and: [{ "seller.store": storeName }, { "seller.email": email }] } },
      {
        $group: {
          _id: "$seller.email",
          placeOrderCount: {
            $sum: {
              $cond: {
                if: { $eq: ["$orderStatus", "placed"] }, then: 1, else: 0
              }
            }
          },
          dispatchOrderCount: {
            $sum: {
              $cond: {
                if: { $eq: ["$orderStatus", "dispatch"] }, then: 1, else: 0
              }
            }
          },
          totalOrderCount: {
            $count: {}
          }
        }
      }
    ]);

    orderCounter = orderCounter[0];

    return res.status(200).send({
      success: true, statusCode: 200, data: {
        module: result,
        placeOrderCount: orderCounter?.placeOrderCount,
        dispatchOrderCount: orderCounter?.dispatchOrderCount,
        totalOrderCount: orderCounter?.totalOrderCount, orders
      }
    });
  } catch (error: any) {
    next(error);
  }
};


module.exports.orderStatusManagement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    const storeName: string = req.params.storeName;

    if (!storeName) throw new Error("Required store name in param !");


    if (!body) throw new Error("Required body information about orders !");

    const { type, customerEmail, orderID, cancelReason, sellerEmail, items } = body;

    if (!type || type === "") throw new Error("Required status type !");
    if (!customerEmail || customerEmail === "") throw new Error("Required customer email !");
    if (!orderID || orderID === "") throw new Error("Required Order ID !");


    const result = await order_status_updater({
      type: type,
      customerEmail,
      orderID,
      cancelReason,
      sellerEmail,
      items
    });

    if (result) {
      if (type === "canceled" && cancelReason && Array.isArray(items)) {
        await Promise.all(items.map(async (item) => await update_variation_stock_available("inc", item)));
      }

      return res.status(200).send({ success: true, statusCode: 200, message: "Order status updated to " + type });
    }

  } catch (error: any) {
    next(error);
  }
}
