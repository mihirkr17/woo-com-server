import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const Product = require("../../model/product.model");
const OrderTable = require("../../model/orderTable.model");
const Review = require("../../model/reviews.model");

module.exports.addProductRating = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { _uuid } = req.decoded;

    const { orderID, itemID, productID, ratingWeight, productReview, name } = req?.body;

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