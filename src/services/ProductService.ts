const dbm = require("mongodb");
const { generateVerificationToken } = require("../utils/generator");
const Product_tbl = require("../model/product.model");

module.exports = class ProductService {
  async isProduct(productID: string, sku: string) {
    const pipeline = [
      { $match: { _id: dbm.ObjectId(productID) } },
      { $unwind: { path: "$variations" } },
      {
        $project: {
          sku: "$variations.sku",
          available: "$variations.available",
          stock: "$variations.stock",
        },
      },
      {
        $match: {
          $and: [{ sku }, { available: { $gte: 1 } }, { stock: "in" }],
        },
      },
    ];

    try {
      const product = await Product_tbl.aggregate(pipeline).exec();

      return product.length === 1 ? true : false;
    } catch (error) {
      // Handle the error at a higher level if needed
      throw error;
    }
  }
};
