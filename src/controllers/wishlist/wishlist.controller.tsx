import { Request, Response } from "express";
const { dbh } = require("../../utils/db");

module.exports.addToWishlistHandler = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
    const userEmail = req.params.email;
    const verifiedEmail = req.decoded.email;
    const body = req.body;

    if (userEmail !== verifiedEmail) {
      return res.status(403).send({ message: "Forbidden" });
    }
    const existsProduct = await userCollection.findOne(
      {
        email: userEmail,
        "wishlist._id": body?._id,
      },
      {
        "wishlist.$": 1,
      }
    );
    if (existsProduct) {
      return res
        .status(200)
        .send({ message: "Product Has Already In Your Wishlist" });
    } else {
      const up = {
        $push: { wishlist: body },
      };

      const wishlistRes = await userCollection.updateOne(
        { email: userEmail },
        up,
        { upsert: true }
      );
      res.status(200).send({
        data: wishlistRes,
        message: "Product Added To Your wishlist",
      });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.removeFromWishlistHandler = async (
  req: Request,
  res: Response
) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
    const productId = req.params.productId;
    const userEmail = req.decoded.email;
    const result = await userCollection.updateOne(
      { email: userEmail },
      { $pull: { wishlist: { _id: productId } } }
    );

    if (result) {
      return res
        .status(200)
        .send({ message: "Product removed from your wishlist" });
    } else {
      return res.status(501).send({ message: "Service unavailable" });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};
