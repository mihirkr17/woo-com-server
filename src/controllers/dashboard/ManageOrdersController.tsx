import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
const { order_status_updater, update_variation_stock_available } = require("../../services/common.services");
const Product = require("../../model/product.model");

module.exports.manageOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const view: any = req.query?.view || "";
    const storeName = req.params.storeName;
    const uuid = req.decoded._UUID;
    let result: any;


    if (storeName) {

      if (view === "group") {
        result = await Order.aggregate([
          { $unwind: "$orders" },
          { $replaceRoot: { newRoot: "$orders" } },
          {
            $lookup: {
              from: 'products',
              localField: 'listingID',
              foreignField: "_LID",
              as: "main_product"
            }
          },
          { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
          {
            $match: {
              $and: [{ "sellerData.storeName": storeName }, { "sellerData.sellerID": uuid }],
            },
          },
          {
            $unset: [
              'bodyInfo', 'main_product',
              "modifiedAt", "paymentInfo",
              "variations", "_id", "tax", "save_as", "reviews",
              "ratingAverage", "_LID", "specification", "rating", "isVerified", "createdAt", "categories"
            ]
          }, {
            $group: {
              _id: "$orderPaymentID",
              orders: {
                $push: "$$ROOT"
              }
            }
          }, {
            $addFields: {
              totalOrderAmount: { $sum: "$orders.baseAmount" }
            }
          }
        ]);
      } else {
        result = await Order.aggregate([
          { $unwind: "$orders" },
          { $replaceRoot: { newRoot: "$orders" } },
          {
            $lookup: {
              from: 'products',
              localField: 'listingID',
              foreignField: "_LID",
              as: "main_product"
            }
          },
          { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
          {
            $match: {
              $and: [{ "sellerData.storeName": storeName }, { "sellerData.sellerID": uuid }],
            },
          },
          {
            $unset: [
              'bodyInfo', 'main_product',
              "modifiedAt", "paymentInfo",
              "variations", "_id", "tax", "save_as", "reviews",
              "ratingAverage", "_LID", "specification", "rating", "isVerified", "createdAt", "categories"
            ]
          }
        ]);
      }
    };

    let newOrderCount = result && result.filter((o: any) => o?.orderStatus === "pending").length;
    let totalOrderCount = result && result.length;

    return res.status(200).send({ success: true, statusCode: 200, data: { module: result, newOrderCount, totalOrderCount } });
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

    const { type, customerEmail, productID, variationID, orderID, listingID, trackingID, quantity, cancelReason } = body;

    if (!type || type === "") throw new Error("Required status type !");
    if (!customerEmail || customerEmail === "") throw new Error("Required customer email !");
    if (!orderID || orderID === "") throw new Error("Required Order ID !");
    if (!trackingID || trackingID === "") throw new Error("Required Tracking ID !");


    const result = await order_status_updater({
      type: type,
      customerEmail,
      orderID,
      trackingID,
      cancelReason
    });

    if (result) {
      if (type === "canceled" && cancelReason) {
        await update_variation_stock_available("inc", { listingID, productID, variationID, quantity });
      }

      return res.status(200).send({ success: true, statusCode: 200, message: "Order status updated to " + type });
    }

  } catch (error: any) {
    next(error);
  }
}