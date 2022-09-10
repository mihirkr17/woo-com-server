import express from "express";
const { ObjectId } = require("mongodb");
const { dbConnection } = require("./db");

module.exports.updateProductStock = async (
  productId: string,
  quantity: number,
  action: string
) => {
  const db = await dbConnection();

  const products = await db.collection("products").findOne({
    _id: ObjectId(productId),
  });

  let availableProduct = products?.available;
  let restAvailable;

  if (action === "inc") {
    restAvailable = availableProduct + quantity;
  }
  if (action === "dec") {
    restAvailable = availableProduct - quantity;
  }

  let stock = restAvailable <= 1 ? "out" : "in";

  await db.collection("products").updateOne(
    { _id: ObjectId(productId) },
    { $set: { available: restAvailable, stock } },
    { upsert: true }
  );
};
