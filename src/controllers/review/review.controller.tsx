import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const Product = require("../../model/product.model");
const OrderTable = require("../../model/orderTable.model");
const Review = require("../../model/reviews.model");
const { Api400Error, Api401Error } = require("../../errors/apiResponse");

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
        rating_point: parseInt(ratingWeight),
        likes: [],
        review_at: new Date(Date.now())
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
}



//  get customer reviews in user account
module.exports.getMyReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { _uuid } = req.decoded;

    const { uuid } = req.params;

    if (_uuid !== uuid) return next(new Api401Error("Unauthorized access !"));

    const reviews = await Review.aggregate([
      { $match: { customerID: uuid } },
      {
        $lookup: {
          from: 'order_table',
          localField: 'orderID',
          foreignField: 'orderID',
          as: 'order'
        }
      },
      { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$order", 0] }, "$$ROOT"] } } },
      { $unset: ["order"] },
      {
        $set: {
          item: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$items",
                  as: "item",
                  cond: { $eq: ["$$item.itemID", "$orderItemID"] }
                }
              },
              0
            ]
          }
        }
      }, {
        $unset: ["items"]
      }, {
        $sort: { _id: -1 }
      }
    ]);

    return res.status(200).send({ success: true, statusCode: 200, reviews });

  } catch (error: any) {
    next(error);
  }
}