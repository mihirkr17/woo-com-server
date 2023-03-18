import { NextFunction, Request, Response } from "express";
const User = require("../../model/user.model");
const Product = require("../../model/product.model");

module.exports.dashboardOverview = async (req: Request, res: Response, next:NextFunction) => {
   try {
      const authEmail: String = req.decoded.email;
      const role: String = req.decoded.role;

      let topSellers: any;
      let topSoldProducts: any;
      let matches: any;

      const user = await User.findOne({ $and: [{ email: authEmail }, { role }] });

      if (user?.role === 'SELLER') {

         matches = { $match: { $and: [{ 'sellerData.storeName': user?.seller?.storeInfos?.storeName }, { 'variations.totalSold': { $exists: true } }] } }
      }

      if (user?.role === 'ADMIN') {

         topSellers = await User.aggregate([
            { $match: { role: 'SELLER' } },
            {
               $project: {
                  totalSold: '$seller.storeInfos.totalSold',
                  storeName: '$seller.storeInfos.storeName',
                  email: '$email',
                  numOfProducts: '$seller.storeInfos.totalProducts',
               }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
         ]);

         matches = { $match: { 'seller.storeInfos.totalSold': { $exists: true } } }
      }

      topSoldProducts = await Product.aggregate([
         { $unwind: { path: '$variations' } },
         matches,
         {
            $project: {
               totalSold: '$variations.totalSold',
               images: '$variations.images',
               title: '$title',
               storeName: '$sellerData.storeName',
               sku: '$variations.sku',
               brand: '$brand',
               categories: '$categories',
               pricing: '$variations.pricing'
            }
         },
         { $sort: { totalSold: -1 } },
         { $limit: 10 }
      ]);



      return res.status(200).send({ success: true, statusCode: 200, data: { topSellers, topSoldProducts } });

   } catch (error: any) {
      next(error);
   }
};

