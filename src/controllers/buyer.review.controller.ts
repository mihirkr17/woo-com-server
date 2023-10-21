import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const Product = require("../model/product.model");
const Order = require("../model/order.model");
const Review = require("../model/reviews.model");
const { Api400Error, Api401Error } = require("../errors/apiResponse");
const { product_detail_review_pipe } = require("../utils/pipelines");

// adding product review and ratings
module.exports.addProductRating = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { _id } = req.decoded;

    const { orderId, productId, ratingWeight, description, name, reviewImage } =
      req?.body;

    const [updatedProduct, newReview, orderUpdateResult] = await Promise.all([
      Product.findOneAndUpdate(
        { _id: ObjectId(productId) },
        [
          {
            $set: {
              rating: {
                $map: {
                  input: "$rating",
                  as: "rat",
                  in: {
                    weight: "$$rat.weight",
                    count: {
                      $cond: [
                        { $eq: ["$$rat.weight", parseInt(ratingWeight)] },
                        { $add: ["$$rat.count", 1] },
                        "$$rat.count",
                      ],
                    },
                  },
                },
              },
              ratingAverage: {
                $round: [
                  {
                    $divide: [
                      {
                        $reduce: {
                          input: "$rating",
                          initialValue: 0,
                          in: {
                            $add: [
                              "$$value",
                              { $multiply: ["$$this.weight", "$$this.count"] },
                            ],
                          },
                        },
                      },
                      {
                        $reduce: {
                          input: "$rating",
                          initialValue: 0,
                          in: { $add: ["$$value", "$$this.count"] },
                        },
                      },
                    ],
                  },
                  1,
                ],
              },
            },
          },
        ],
        { new: true }
      ),

      description &&
        new Review({
          productId: productId,
          orderId: orderId,
          name,
          customerId: _id,
          productImages: reviewImage.slice(0, 5) ?? [],
          comments: description,
          ratingPoint: parseInt(ratingWeight),
          verifiedPurchase: true,
          likes: [],
          reviewAt: new Date(Date.now()),
        }).save(),

      Order.findOneAndUpdate(
        { _id: ObjectId(orderId) },
        {
          $set: {
            isRated: true,
          },
        },
        { upsert: true }
      ),
    ]);

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Thanks for your review !",
    });
  } catch (error: any) {
    next(error);
  }
};

// this is controllers of getting all reviews in product detail page
// get reviews in product detail page
module.exports.getReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;

    let { page, sort } = req.query as { page: any; sort: string };

    if (!productId) throw new Api400Error("Required product id !");

    page = page && parseInt(page);

    page = typeof page === "number" && page === 1 ? 0 : page - 1;

    let sortFilter =
      sort === "asc"
        ? { rating_point: 1 }
        : sort === "dsc"
        ? { rating_point: -1 }
        : { _id: -1 };

    const result =
      (await Review.find({ productId: ObjectId(productId) })
        .sort(sortFilter)
        .skip(page * 2)
        .limit(2)) ?? [];

    const reviewCount =
      (await Review.countDocuments({ productId: ObjectId(productId) })) ?? 0;

    res
      .status(200)
      .send({ success: true, statusCode: 200, reviews: result, reviewCount });
  } catch (error: any) {
    next(error);
  }
};

module.exports.toggleVotingLike = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // getting uuid from jwt token;
    const { _uuid } = req.decoded;

    // getting review id from req body;
    const { reviewID } = req.body;

    if (!reviewID) throw new Api400Error("Required review id from body !");

    // find one review by review id;
    const review = await Review.findOne({ _id: ObjectId(reviewID) });

    if (!review) throw new Api400Error("Review not found !");

    // finding user id inside review like array;
    let userIndex = review.likes.indexOf(_uuid);

    if (userIndex !== -1) {
      review.likes.splice(userIndex, 1);
    } else {
      review.likes.push(_uuid);
    }

    const result = await review.save();

    if (!result) throw new Api400Error("Operation failed !");

    return res.status(200).send({ success: true, statusCode: 200 });
  } catch (error: any) {
    next(error);
  }
};

//  get customer reviews in user account
module.exports.getMyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { _id } = req.decoded;

    const reviews = await Review.aggregate([
      { $match: { customerId: ObjectId(_id) } },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [{ $arrayElemAt: ["$order", 0] }, "$$ROOT"],
          },
        },
      },
      { $unset: ["order"] },
      {
        $sort: { _id: -1 },
      },
    ]);

    return res.status(200).send({ success: true, statusCode: 200, reviews });
  } catch (error: any) {
    next(error);
  }
};

module.exports.getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pid, sku, oid } = req?.query;

    if (!pid || !sku || !oid)
      return next(new Api400Error("Required product and sku and order id !"));

    const getOrder = await Order.findOne({
      $and: [
        { _id: ObjectId(oid) },
        { productId: ObjectId(pid) },
        { sku: sku },
      ],
    });

    if (!getOrder) return next(new Api400Error("Order not found !"));

    let product = await Product.aggregate(product_detail_review_pipe(pid, sku));

    product = product[0];

    return res.status(200).send({
      success: true,
      statusCode: 200,
      response: product,
      message: getOrder?.is_rated ? "You already review this product." : null,
    });
  } catch (error: any) {
    next(error);
  }
};
