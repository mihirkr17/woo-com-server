import express from "express";
const { ObjectId } = require("mongodb");
const Product = require("../model/product.model");

module.exports.updateProductStock = async (
  productID: string,
  variationID: string,
  restAvailable: number
) => {
  try {

    let stock = restAvailable <= 1 ? "out" : "in";

    return await Product.findOneAndUpdate(
      { _id: ObjectId(productID) },
      {
        $set: {
          "variations.$[i].available": restAvailable,
          "variations.$[i].stock": stock
        }
      },
      { arrayFilters: [{ "i._vrid": variationID }] }
    );

  } catch (error: any) {
    return error;
  }
};
