// ManageProduct.Controller.tsx

import { NextFunction, Request, Response } from "express";
const { ObjectId } = require("mongodb");
const User = require("../../model/user.model");
const QueueProduct = require("../../model/queueProduct.model");
const Product = require("../../model/product.model");
const { Api400Error, Api500Error } = require("../../errors/apiResponse");


module.exports.productControlController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { market_place, actionType, actionFor,
         listingID, productID } = req?.body;

      if (market_place !== 'wooKart') throw new Api400Error("Permission denied !");

      if (!listingID || !productID) throw new Api400Error("Required product id and listing id !");

      let filters: any;

      if (actionFor === "status" && (["Active", "Inactive"].includes(actionType))) {
         filters = {
            $set: { status: actionType }
         }
      }


      if (!filters) throw new Api400Error("Required filter !");

      const result = await Product.findOneAndUpdate({ $and: [{ _lid: listingID }, { _id: ObjectId(productID) }] },
         filters, { upsert: true }
      );

      if (result) {
         return res.status(200).send({ success: true, statusCode: 200, message: `Request ${actionType} success.` });
      }

   } catch (error: any) {
      next(error);
   }
}



module.exports.viewAllProductsInDashboard = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const authEmail = req.decoded.email;
      const role = req.decoded.role;

      const user = await User.findOne({ $and: [{ email: authEmail }, { role }] });

      let item: any;
      let page: any;
      item = req.query.items;
      page = req.query.page;
      let searchText: any = req.query.search;
      let filters: any = req.query.category;
      let products: any;
      let draftProducts: any;
      let inactiveProduct: any;

      let showFor: any[];
      let src: any[] = [];

      if (user.role === 'SUPPLIER') {
         showFor = [
            { "supplier.storeName": user?.store?.name },
            { isVerified: true }
         ];
      } else {
         showFor = [{ status: "Active" }];
      }

      page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;

      if (searchText) {
         filters = '';
         src = [
            { title: { $regex: searchText, $options: "i" } },
            { "supplier.storeName": { $regex: searchText, $options: "i" } },
         ]
      } else if (filters) {
         searchText = '';
         src = [{ categories: { $in: [filters] } }];
      } else {
         src = [{}];
      }

      products = await Product.aggregate([
         {
            $match: {
               $and: showFor,
               $or: src
            }
         },
         {
            $project: {
               title: 1, slug: 1,
               categories: 1,
               pricing: 1,
               variations: 1,
               brand: 1,
               _lid: 1,
               packaged: 1,
               status: 1,
               shipping: 1,
               keywords: 1,
               metaDescription: 1,
               specification: 1,
               description: 1,
               manufacturer: 1,
               options: 1,
               supplier: 1,
               totalVariation: { $cond: { if: { $isArray: "$variations" }, then: { $size: "$variations" }, else: 0 } }
            }
         },
         {
            $skip: page * parseInt(item)
         }, {
            $limit: (parseInt(item))
         }
      ]);

      draftProducts = await Product.aggregate([
         {
            $match: {
               $and: [{ status: "Inactive" }, { "supplier.storeName": user?.store?.name }]
            }
         },
         {
            $project: {
               title: 1, slug: 1, 
               categories: 1, pricing: 1,
               images: 1, variations: 1, brand: 1, _lid: 1,
               packaged: 1,
               status: 1,
               shipping: 1,
               keywords: 1,
               metaDescription: 1,
               options: 1,
               specification: 1,
               description: 1,
               manufacturer: 1,
               supplier: 1,
               totalVariation: { $cond: { if: { $isArray: "$variations" }, then: { $size: "$variations" }, else: 0 } }
            }
         },
         {
            $skip: page * parseInt(item)
         }, {
            $limit: (parseInt(item))
         }
      ]);

      inactiveProduct = await Product.aggregate([
         { $unwind: { path: "$variations" } },
         {
            $match: {
               $and: [
                  user?.role === 'SUPPLIER' && { "supplier.storeName": user?.store?.name },
                  { status: 'Inactive' }
               ]
            }
         }
      ]);


      return res.status(200).send({
         success: true,
         statusCode: 200,
         data: { products, draftProducts, inactiveProduct },
      });
   } catch (error: any) {
      next(error);
   }
};


/**
* @controller      --> Fetch the single product in product edit page.
* @required        --> [req.query:seller, req.query:productID, req.query:sku]
* @request_method  --> GET
*/
module.exports.getProductForSellerDSBController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const productID = req.query.pid;
      const sku = req.query.sku;
      const storeName = req.query.storeName;

      let product;

      if (!storeName && typeof storeName === 'undefined' && !productID) return res.status(204).send();

      if (sku && typeof sku === 'string') {
         product = await Product.aggregate([
            {
               $match: { _id: ObjectId(productID) }
            },
            {
               $unwind: { path: "$variations" },
            },
            {
               $match: { 'variations.sku': sku }
            }
         ]);
         product = product[0];

      } else {
         product = await Product.findOne({
            $and: [{ _id: ObjectId(productID) }, { "supplier.storeName": storeName }],
         });
      }

      return product
         ? res.status(200).send(product)
         : res.status(404).send({
            success: false,
            statusCode: 404,
            error: "Product not found!!!",
         });
   } catch (error: any) {
      next(error);
   }
};


module.exports.productFlashSaleController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const storeName = req.params.storeName;

      const body = req.body;

      const productID = body?.data?.productID;

      const listingID = body?.data?.listingID;

      const fSale = body?.data?.fSale;

      const product = await Product.findOne({ $and: [{ _id: ObjectId(productID) }, { _lid: listingID }, { "supplier.storeName": storeName }] });


      if (!product) {
         return res.status(200).send({ success: false, statusCode: 200, message: "Product Not found !" });
      }

      const result = await Product.updateOne(
         {
            $and:
               [
                  { _id: ObjectId(productID) }, { _lid: listingID }, { "supplier.storeName": storeName }
               ]
         },

         {
            $set: {
               isFlashSale: true,
               flashSale: fSale
            }
         },

         {
            upsert: true
         }
      );


      if (result) {
         return res.status(200).send({ success: true, statusCode: 200, message: "Flash Sale Starting...." })
      }


   } catch (error: any) {
      next(error);
   }
}

module.exports.queueProductsController = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { storeName } = req.params;
      const { email } = req.decoded;

      if (!storeName) throw new Api400Error("Required store name as a parameter !");

      const queueProduct = await QueueProduct.find({ $and: [{ "supplier.email": email }, { "supplier.storeName": storeName }] }) || [];

      let countQueue = queueProduct.length || 0;

      if (!Array.isArray(queueProduct)) throw new Api400Error("Queue is empty !");

      return res.status(200).send({ success: true, statusCode: 200, data: { queue: queueProduct, countQueue } });

   } catch (error: any) {
      next(error);
   }
}