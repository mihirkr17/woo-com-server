import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const Product = require("../../model/product.model");
const OrderTable = require("../../model/orderTable.model");
const Review = require("../../model/reviews.model");
const { Api400Error } = require("../../errors/apiResponse");

module.exports.addProductRating = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { _uuid } = req.decoded;

    const { orderID, itemID, productID, ratingWeight, productReview, name, reviewImage } = req?.body;

    const [updatedProduct, newReview, orderUpdateResult] = await Promise.all([

      Product.findOneAndUpdate(
        { _id: ObjectId(productID) },
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
                        "$$rat.count"
                      ]
                    }
                  }
                }
              },
              ratingAverage: {
                $round: [{
                  $divide: [
                    {
                      $reduce: {
                        input: "$rating",
                        initialValue: 0,
                        in: {
                          $add: [
                            "$$value",
                            { $multiply: ["$$this.weight", "$$this.count"] }
                          ]
                        }
                      }
                    },
                    {
                      $reduce: {
                        input: "$rating",
                        initialValue: 0,
                        in: { $add: ["$$value", "$$this.count"] }
                      }
                    }
                  ]
                }, 1
                ]
              }
            }
          }
        ],
        { new: true }
      ),

      new Review({
        productID,
        orderID,
        name,
        customerID: _uuid,
        orderItemID: itemID,
        product_images: reviewImage.slice(0, 5) ?? [],
        product_review: productReview,
        rating_point: parseInt(ratingWeight)
      }).save(),

      OrderTable.findOneAndUpdate(
        { orderID },
        {
          $set: {
            "items.$[i].isRated": true,
          },
        },
        { arrayFilters: [{ "i.itemID": itemID }], upsert: true }
      )
    ]);

    return res.status(200).send({ success: true, statusCode: 200, message: "Thanks for your review !" });

  } catch (error: any) {
    next(error);
  }
};

module.exports.getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productID } = req.params;

    let { page } = req.query as { page: any };

    if (!productID) throw new Api400Error("Required product id !");

    page = page && parseInt(page);

    page = typeof page === "number" && page === 1 ? 0 : page - 1;

    const result = await Review.find({ productID: ObjectId(productID) }).sort({ _id: -1 }).skip(page * 2).limit(2) ?? [];

    const reviewCount = await Review.countDocuments({ productID: ObjectId(productID) }) ?? 0;

    res.status(200).send({ success: true, statusCode: 200, reviews: result, reviewCount });

  } catch (error: any) {
    next(error);
  }
}


module.exports.toggleVotingLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { _uuid } = req.decoded;
    const { reviewID } = req.body;

    const review = await Review.findOne({ _id: ObjectId(reviewID) });

    if (!review) throw new Api400Error("Review not found !");

    let userIndex = review.likes.indexOf(_uuid);
    let flag: string = "";

    if (userIndex !== -1) {
      flag = "";
      review.likes.splice(userIndex, 1);
    } else {
      flag = "Thanks for liked."
      review.likes.push(_uuid);
    }

    const result = await review.save();

    console.log(result);

    if (result) return res.status(200).send({ success: true, statusCode: 200, message: flag, data: result });

  } catch (error: any) {
    next(error);
  }
}