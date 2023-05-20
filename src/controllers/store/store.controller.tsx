import { NextFunction, Request, Response } from "express";
const Product = require("../../model/product.model");

const { home_store_product_pipe } = require("../../utils/pipelines");



module.exports.getStore = async (req: Request, res: Response, next: NextFunction) => {

   try {

      const { storeName } = req?.params;
      const { limit } = req?.query;

      let totalLimit = typeof limit === "string" && parseInt(limit);

      const allProducts = await Product.aggregate(home_store_product_pipe(totalLimit));

      const products = await Product.aggregate([
         { $match: { $and: [{ "supplier.store_name": storeName }, { status: "active" }] } },
         {
            $addFields: {
               
            }
         }
      ]);


      return res.status(200).send({ success: true, statusCode: 200, data: { allProducts, } });
   } catch (error: any) {
      next(error);
   }
}