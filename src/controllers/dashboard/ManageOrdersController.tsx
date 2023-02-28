import { NextFunction, Request, Response } from "express";
const Order = require("../../model/order.model");
const { order_status_updater } = require("../../services/common.services");
const Product = require("../../model/product.model");
const { ObjectId } = require("mongodb");


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


module.exports.dispatchOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;

    if (body?.context?.MARKET_PLACE !== "WooKart") {
      throw new Error("Invalid operation !");
    }

    if (!body?.module) {
      throw new Error("Invalid operation !");
    }

    const { trackingID, orderID, customerEmail } = body && body?.module;

    const result = await order_status_updater({
      type: "dispatch",
      customerEmail,
      orderID,
      trackingID
    });

    return (result?.success && result?.success) ?
      res.status(200).send({ success: true, statusCode: 200, message: "Successfully order dispatched" }) :
      res.status(500).send({ success: false, statusCode: 500, message: "failed to update" });

  } catch (error: any) {
    next(error);
  }
};



module.exports.orderStatusManagement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;

    if (!body) throw new Error("Required body information about orders !");

    const { type, customerEmail, productID, variationID, orderID, listingID, trackingID, quantity, cancelReason } = body;

    const result = await order_status_updater({
      type: type,
      customerEmail,
      orderID,
      trackingID,
      cancelReason
    });

    if (result) {
      if (type === "canceled" && cancelReason) {

        let product = await Product.aggregate([
          { $match: { $and: [{ _LID: listingID }, { _id: ObjectId(productID) }] } },
          { $unwind: { path: "$variations" } },
          {
            $project: {
              variations: 1
            }
          },
          { $match: { $and: [{ "variations._VID": variationID }] } },
          {
            $project: {
              available: "$variations.available"
            }
          }
        ]);

        product = product[0];

        let availableProduct = parseInt(product?.available);
        let restAvailable = availableProduct + parseInt(quantity);
        let stock = restAvailable <= 0 ? "out" : "in";

        await Product.findOneAndUpdate(
          { $and: [{ _LID: listingID }, { _id: ObjectId(productID) }] },
          {
            $set: {
              "variations.$[i].available": restAvailable,
              "variations.$[i].stock": stock
            }
          },
          { arrayFilters: [{ "i._VID": variationID }] }
        );

      }

      return res.status(200).send({ success: true, statusCode: 200, message: "Order status updated to " + type });
    }


  } catch (error: any) {
    next(error);
  }
}