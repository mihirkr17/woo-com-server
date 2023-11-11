const dbm = require("mongodb");
const { generateVerificationToken } = require("../utils/generator");
const Product_tbl = require("../model/PRODUCT_TBL");
const ProductVariation_tbl = require("../model/PRODUCT_VARIATION_TBL");

module.exports = class ProductService {
  async isProduct(productID: string, sku: string) {
    const pipeline = [
      { $match: { _id: dbm.ObjectId(productID) } },
      {
        $lookup: {
          from: "PRODUCT_VARIATION_TBL",
          localField: "_id",
          foreignField: "productId",
          as: "variations",
        },
      },
      {
        $addFields: {
          variation: {
            $arrayElemAt: [
              {
                $ifNull: [
                  {
                    $filter: {
                      input: "$variations",
                      as: "variation",
                      cond: { $eq: ["$$variation.sku", sku] },
                    },
                  },
                  [],
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $match: { "variation.sku": sku },
      },
      {
        $project: {
          storeId: 1,
          storeTitle: 1,
          brand: 1,
          sku: "$variation.sku",
          stockQuantity: "$variation.stockQuantity",
          stock: "$variation.stock",
        },
      },
      {
        $match: {
          $and: [{ sku }, { stockQuantity: { $gte: 1 } }, { stock: "in" }],
        },
      },
    ];

    try {
      const product = await Product_tbl.aggregate(pipeline).exec();

      return product.length === 1 ? product[0] : null;
    } catch (error) {
      // Handle the error at a higher level if needed
      throw error;
    }
  }
};
