import { NextFunction, Request, Response } from "express";
const User = require("../model/CUSTOMER_TBL");
const apiResponse = require("../res/response");
const { findUserByEmail } = require("../services/common.service");

module.exports.addToWishlistHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userEmail = req.params.email;
    const verifiedEmail = req.decoded.email;
    const body = req.body;

    if (userEmail !== verifiedEmail) {
      throw new apiResponse.Error403("Forbidden !");
    }

    if (!body || typeof body === "undefined") {
      throw new apiResponse.Error400("Required body !");
    }

    const { productID, sku, listingID } = body;

    interface WImodel {
      productID: string;
      listingID: string;
      sku: string;
    }

    let model: WImodel = {
      productID,
      sku,
      listingID,
    };

    let user = await findUserByEmail(verifiedEmail);

    if (user) {
      let existsProduct =
        (Array.isArray(user?.buyer?.wishlist) &&
          user?.buyer?.wishlist.filter(
            (e: any) => e?.productID === body?.productID && e?.sku === body?.sku
          )) ||
        [];

      if (existsProduct && existsProduct.length >= 1) {
        return res
          .status(200)
          .send({
            success: true,
            statusCode: 200,
            message: "Product Has Already In Your Wishlist",
          });
      }

      const wishlistRes = await User.findOneAndUpdate(
        { email: userEmail },
        { $push: { "buyer.wishlist": model } },
        { upsert: true }
      );

      return res.status(200).send({
        success: true,
        statusCode: 200,
        data: wishlistRes,
        message: "Product Added To Your wishlist",
      });
    }
  } catch (error: any) {
    next(error);
  }
};

module.exports.removeFromWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const productID = req.params.productID;
    const userEmail = req.decoded.email;

    const result = await User.findOneAndUpdate(
      { email: userEmail },
      { $pull: { "buyer.wishlist": { productID } } }
    );

    if (result) {
      return res
        .status(200)
        .send({
          success: true,
          statusCode: 200,
          message: "Product removed from your wishlist",
        });
    } else {
      throw new apiResponse.Error500("Service unavailable");
    }
  } catch (error: any) {
    next(error);
  }
};
