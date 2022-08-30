import express from "express";
const { ObjectId } = require("mongodb");
const { dbh } = require("./db");

module.exports.updateProductStock = async (
  productId: string,
  quantity: number,
  action: string
) => {
  await dbh.connect();
  const productsCollection = dbh.db("Products").collection("product");
  const products = await productsCollection.findOne({
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

  await productsCollection.updateOne(
    { _id: ObjectId(productId) },
    { $set: { available: restAvailable, stock } },
    { upsert: true }
  );
};
