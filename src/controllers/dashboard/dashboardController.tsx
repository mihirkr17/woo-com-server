import { NextFunction, Request, Response } from "express";
const User = require("../../model/user.model");
const Product = require("../../model/product.model");

module.exports.dashboardOverview = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const authEmail: String = req.decoded.email;
      const role: String = req.decoded.role;

      let topSellers: any;
      let topSoldProducts: any;
      let matches: any;

      const user = await User.findOne({ $and: [{ email: authEmail }, { role }] });

      if (user?.role === 'SELLER') {

         matches = { $match: { $and: [{ 'supplier.store_name': user?.store?.name }, { 'variations.totalSold': { $exists: true } }] } }
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
               storeName: '$supplier.store_name',
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



module.exports.allSellers = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const sellers = await User.find({ $and: [{ isSeller: "fulfilled" }, { role: "SELLER" }] }) || [];
      return res.status(200).send({ success: true, statusCode: 200, sellers });
   } catch (error: any) {
      next(error);
   }
}

module.exports.allBuyers = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const search = req.query?.search;
      let page: any = req.query?.page;
      let item: any = req.query?.item;
      let filter: any = [];

      item = parseInt(item) || 2;

      page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;
      
      let totalBuyerCount: any;

      if (search && search !== "") {
         filter = [{
            $match: {
               $and: [{ idFor: "buy" }, { role: "BUYER" }],
               $or: [{ email: { $regex: search, $options: 'mi' } }]
            }
         }];

      } else {
         filter = [
            {
               $match: {
                  $and: [{ idFor: "buy" }, { role: "BUYER" }],
               }
            }, { $skip: (page * item) || 0 }, { $limit: item }
         ];

         totalBuyerCount = await User.countDocuments({
            $and: [{ idFor: "buy" }, { role: "BUYER" }],
         }) || 0;
      }

      const buyers: any = await User.aggregate(filter) || [];

      return res.status(200).send({ success: true, statusCode: 200, buyers, totalBuyerCount });
   } catch (error: any) {
      next(error);
   }
}