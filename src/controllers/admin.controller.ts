// src/controllers/admin.controller.ts

import { NextFunction, Request, Response } from "express";
const Product = require("../model/PRODUCT_TBL");
const User = require("../model/CUSTOMER_TBL");
const Store = require("../model/SUPPLIER_TBL");
const smtpSender = require("../services/email.service");
const ORDER_TABLE = require("../model/ORDER_TBL");
const {
  Error400,
  Error403,
  Error404,
  Error500,
} = require("../res/response");

/**
 *
 * @param req
 * @param res
 * @param next
 */
async function adminOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const pages: any = req.query.pages;
    const item: any = req.query.items;
    let queueProducts: any;

    let countQueueProducts = await Product.countDocuments({ status: "Queue" });

    const suppliers = await User.find({ role: "SUPPLIER" });
    const customers = await User.find({ role: "CUSTOMER" });

    let cursor = await Product.find({ isVerified: false, status: "Queue" });

    if (pages || item) {
      queueProducts = await cursor
        .skip(parseInt(pages) > 0 ? (pages - 1) * item : 0)
        .limit(item);
    } else {
      queueProducts = await cursor;
    }

    return res.status(200).send({
      success: true,
      statusCode: 200,
      queueProducts,
      countQueueProducts,
      suppliers,
      customers,
    });
  } catch (error: any) {
    next(error);
  }
}

async function verifyThisProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { role, email } = req?.decoded;

    const { productId } = req.body;

    if (role !== "ADMIN") throw new Error403("Forbidden !");

    if (!productId) {
      throw new Error403("Product ID required !");
    }

    const result = await Product.findOneAndUpdate(
      { $and: [{ _id: ObjectId(productId) }, { status: "Queue" }] },
      {
        $set: {
          isVerified: true,
          status: "Active",
          verifiedBy: email,
          verifiedAt: new Date(Date.now()),
        },
      },
      { upsert: true }
    );

    if (result?.upsertedCount === 1) {
      return res.status(200).send({
        success: true,
        statusCode: 200,
        message: "Product successfully launched.",
      });
    } else {
      return res.status(200).send({
        success: false,
        statusCode: 200,
        message: "Product not taken !",
      });
    }
  } catch (error: any) {
    next(error);
  }
}

async function verifySellerAccount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { uuid, id, email } = req.body;

    if (!uuid || typeof uuid === "undefined")
      throw new Error400("Required user unique id !");

    if (!id || typeof id === "undefined")
      throw new Error400("Required id !");

    const result = await User.findOneAndUpdate(
      {
        $and: [
          { _id: ObjectId(id) },
          { email },
          { _uuid: uuid },
          { isSeller: "pending" },
        ],
      },
      {
        $set: {
          accountStatus: "Active",
          isSeller: "fulfilled",
          becomeSellerAt: new Date(),
        },
      },
      {
        upsert: true,
      }
    );

    if (result) {
      await smtpSender({
        to: result?.email,
        subject: "Verify email address",
        html: `
               <h5>Thanks for with us !</h5>
               <p style="color: 'green'">We have verified your seller account. Now you can login your seller id.</p>
            `,
      });
      return res.status(200).send({
        success: true,
        statusCode: 200,
        message: "Permission granted.",
      });
    }

    throw new Error500("Internal problem !");
  } catch (error: any) {
    next(error);
  }
}

async function deleteSupplierAccount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, email } = req.body;

    if (!id || typeof id === "undefined")
      throw new Error400("Required id !");

    if (!ObjectId.isValid(id)) throw new Error400("Invalid supplier id !");

    await User.deleteOne({
      $and: [{ _id: ObjectId(id) }, { email }],
    });
    await Store.deleteOne({ userId: ObjectId(id) });

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Account deleted successfully.",
    });

    throw new Error500("Internal server error !");
  } catch (error: any) {
    next(error);
  }
}

async function getBuyerInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, email } = req.body;

    const order = await ORDER_TABLE.findOne({ user_email: email });

    if (order) {
      let totalOrder =
        (Array.isArray(order?.orders) && order?.orders.length) || 0;

      return res.status(200).send({
        success: true,
        statusCode: 200,
        data: {
          totalOrder,
        },
      });
    }

    throw new Error404("Data not found !");
  } catch (error: any) {
    next(error);
  }
}

async function allSuppliers(req: Request, res: Response, next: NextFunction) {
  try {
    const sellers =
      (await User.find({
        $and: [{ isSeller: "fulfilled" }, { role: "SELLER" }],
      })) || [];
    return res.status(200).send({ success: true, statusCode: 200, sellers });
  } catch (error: any) {
    next(error);
  }
}

async function allBuyers(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query?.search;
    let page: any = req.query?.page;
    let item: any = req.query?.item;
    let filter: any = [];

    item = parseInt(item) || 2;

    page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;

    let totalBuyerCount: any;

    if (search && search !== "") {
      filter = [
        {
          $match: {
            $and: [{ idFor: "buy" }, { role: "CUSTOMER" }],
            $or: [{ email: { $regex: search, $options: "mi" } }],
          },
        },
      ];
    } else {
      filter = [
        {
          $match: {
            $and: [{ idFor: "buy" }, { role: "CUSTOMER" }],
          },
        },
        { $skip: page * item || 0 },
        { $limit: item },
      ];

      totalBuyerCount =
        (await User.countDocuments({
          $and: [{ idFor: "buy" }, { role: "CUSTOMER" }],
        })) || 0;
    }

    const buyers: any = (await User.aggregate(filter)) || [];

    return res
      .status(200)
      .send({ success: true, statusCode: 200, buyers, totalBuyerCount });
  } catch (error: any) {
    next(error);
  }
}

module.exports = {
  adminOverview,
  verifyThisProduct,
  verifySellerAccount,
  deleteSupplierAccount,
  getBuyerInfo,
  allSuppliers,
  allBuyers,
};
