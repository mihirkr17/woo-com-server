import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const Product = require("../../model/product.model");
const Order = require("../../model/order.model");
const Review = require("../../model/reviews.model");
const { Api400Error, Api401Error } = require("../../errors/apiResponse");
const { get_review_product_details_pipe } = require("../../utils/pipelines");

// adding product review and ratings
module.exports.addProductRating = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { _uuid } = req.decoded;

    const { orderID, productID, ratingWeight, description, name, reviewImage } = req?.body;

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

      description && new Review({
        product_id: productID,
        order_id: orderID,
        name,
        customer_id: _uuid,
        product_images: reviewImage.slice(0, 5) ?? [],
        comments: description,
        rating_point: parseInt(ratingWeight),
        verified_purchase: true,
        likes: [],
        review_at: new Date(Date.now())
      }).save(),

      Order.findOneAndUpdate(
        { order_id: orderID },
        {
          $set: {
            is_rated: true,
          }
        },
        { upsert: true }
      )
    ]);

    return res.status(200).send({ success: true, statusCode: 200, message: "Thanks for your review !" });

  } catch (error: any) {
    next(error);
  }
};

// this is controllers of getting all reviews in product detail page
// get reviews in product detail page
module.exports.getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productID } = req.params;

    let { page, sort } = req.query as { page: any, sort: string };

    if (!productID) throw new Api400Error("Required product id !");

    page = page && parseInt(page);

    page = typeof page === "number" && page === 1 ? 0 : page - 1;

    let sortFilter = sort === "asc" ? { rating_point: 1 } : sort === "dsc" ? { rating_point: -1 } : { _id: -1 };

    const result = await Review.find({ product_id: ObjectId(productID) }).sort(sortFilter).skip(page * 2).limit(2) ?? [];

    const reviewCount = await Review.countDocuments({ product_id: ObjectId(productID) }) ?? 0;

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
      { $match: { customer_id: uuid } },
      {
        $lookup: {
          from: 'order_table',
          localField: 'order_id',
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
                  cond: { $eq: ["$$item.itemID", "$order_item_id"] }
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



module.exports.getProductDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { pid, sku, oid } = req?.query;

    if (!pid || !sku || !oid) return next(new Api400Error("Required product and sku and order id !"));

    const getOrder = await Order.findOne({
      $and: [
        { order_id: oid },
        { "product.product_id": pid },
        { "product.sku": sku }
      ]
    });

    if (!getOrder) return next(new Api400Error("Order not found !"));

    let product = await Product.aggregate(get_review_product_details_pipe(pid, sku));

    product = product[0];

    return res.status(200).send({ success: true, statusCode: 200, response: product,  message: (getOrder?.is_rated) ? "You already review this product." : null })

  } catch (error: any) {
    next(error);
  }
}