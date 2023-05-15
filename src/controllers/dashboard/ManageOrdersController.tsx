import { NextFunction, Request, Response } from "express";
const { order_status_updater, update_variation_stock_available } = require("../../services/common.service");
const OrderTableModel = require("../../model/orderTable.model");
const apiResponse = require("../../errors/apiResponse");

module.exports.manageOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const filters: any = req.query.filters;
    const { storeName } = req.params;
    const { email } = req.decoded;

    let filterProjection: any = {};

    if (filters) {
      filterProjection = { $and: [{ "seller.store": storeName }, { "seller.email": email }, { orderStatus: filters }] }
    } else {
      filterProjection = { $and: [{ "seller.store": storeName }, { "seller.email": email }] }
    }

    const orders = await OrderTableModel.find(filterProjection).sort({ _id: -1 }) ?? [];

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
        placeOrderCount: orderCounter?.placeOrderCount,
        dispatchOrderCount: orderCounter?.dispatchOrderCount,
        totalOrderCount: orderCounter?.totalOrderCount,
        orders
      }
    });
  } catch (error: any) {
    next(error);
  }
};


module.exports.orderStatusManagement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeName: string = req.params.storeName;

    if (!storeName) throw new apiResponse.Api400Error("Required store name in param !");

    if (!req.body) throw new apiResponse.Api400Error("Required body information about orders !");

    const { type, customerEmail, orderID, cancelReason, sellerEmail, items } = req.body as {
      type: string, customerEmail: string, orderID: string, cancelReason: string, sellerEmail: string, items: any[]
    };

    if (!type || type === "") throw new apiResponse.Api400Error("Required status type !");

    if (!customerEmail) throw new apiResponse.Api400Error("Required customer email !");

    if (!orderID || orderID === "") throw new apiResponse.Api400Error("Required Order ID !");


    const result = await order_status_updater({
      type,
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
