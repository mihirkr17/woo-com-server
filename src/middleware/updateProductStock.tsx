// import { Request, Response } from "express";
// const {dbh} = require("./db");
// module.exports.updateProductStock = async (req:Request, res:Response) => {
//    const {body} = req;

//   await dbh.connect();
//   const productsCollection = dbh.db("ecommerce-db").collection("products");
//   const products = await productsCollection.findOne({
//     _id: ObjectId(body?.productId),
//   });

//   let availableProduct = products?.available;
//   let restAvailable;

//   if (action === "inc") {
//     restAvailable = availableProduct + body?.quantity;
//   }
//   if (action === "dec") {
//     restAvailable = availableProduct - body?.quantity;
//   }

//   let stock = restAvailable <= 1 ? "out" : "in";

//   await productsCollection.updateOne(
//     { _id: ObjectId(body?.productId) },
//     { $set: { available: restAvailable, stock } },
//     { upsert: true }
//   );
// };
