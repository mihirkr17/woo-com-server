import { NextFunction, Request, Response } from "express";
const User = require("../../model/user.model");
const apiResponse = require("../../errors/apiResponse");
const { findUserByEmail } = require("../../services/common.service");

module.exports.addToWishlistHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userEmail = req.params.email;
    const verifiedEmail = req.decoded.email;
    const body = req.body;

    if (userEmail !== verifiedEmail) {
      throw new apiResponse.Api403Error("Forbidden !");
    }

    if (!body || typeof body === "undefined") {
      throw new apiResponse.Api400Error("Required body !");
    }

    const { productID, variationID, listingID } = body;

    interface WImodel {
      productID: string;
      listingID: string;
      variationID: string;
    }

    let model: WImodel = {
      productID,
      variationID,
      listingID
    }

    let user = await findUserByEmail(verifiedEmail);

    if (user) {

      let existsProduct = (Array.isArray(user?.buyer?.wishlist) && user?.buyer?.wishlist.filter((e: any) => (e?.productID === body?.productID && e?.variationID === body?.variationID))) || [];

      if (existsProduct && existsProduct.length >= 1) {
        return res.status(200).send({ success: true, statusCode: 200, message: "Product Has Already In Your Wishlist" })
      }

      const wishlistRes = await User.findOneAndUpdate({ email: userEmail },
        { $push: { "buyer.wishlist": model } },
        { upsert: true });

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
      return res.status(200).send({ success: true, statusCode: 200, message: "Product removed from your wishlist" });
    } else {
      throw new apiResponse.Api500Error("Service unavailable");
    }
  } catch (error: any) {
    next(error);
  }
};
