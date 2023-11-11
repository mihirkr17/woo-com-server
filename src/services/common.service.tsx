// common.services.tsx
const mdb = require("mongodb");
const Product = require("../model/PRODUCT_TBL");
const ProductVariationTbl = require("../model/PRODUCT_VARIATION_TBL");
const UserModel = require("../model/user.model");
const ShoppingCartModel = require("../model/shoppingCart.model");
const cryptos = require("crypto");
const apiResponse = require("../errors/apiResponse");
const { generateTrackingID } = require("../utils/generator");
const NCache = require("../utils/NodeCache");
const Order = require("../model/ORDER_TBL");
const Store = require("../model/store.model");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports.findUserByEmail = async (email: string) => {
   try {
      return await UserModel.findOne(
         { $and: [{ email: email }, { accountStatus: 'Active' }] },
         {
            password: 0,
            createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
         }
      );
   } catch (error: any) {
      throw error;
   }
}


/**
 * @params {id} user _id
 */
module.exports.findUserById = async (id: string) => {
   try {
      return await UserModel.findOne(
         { $and: [{ _id: mdb.ObjectId(id) }, { accountStatus: 'Active' }] },
         {
            password: 0,
            createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
         }
      );
   } catch (error: any) {
      throw error;
   }
}

module.exports.orderStatusUpdater = async (obj: any) => {
   try {
      const { customerEmail, customerId, type, orderID, cancelReason, refundAT } = obj;

      let setQuery: any = {};
      const timestamp = Date.now();

      if (type === "dispatch") {

         setQuery = {
            $set: {
               orderStatus: "dispatch",
               orderDispatchedAt: new Date(timestamp),
               trackingId: generateTrackingID()
            }
         }
      }

      else if (type === "shipped") {
         setQuery = {
            $set: {
               orderStatus: "shipped",
               orderShippedAt: new Date(timestamp)
            }
         }
      }

      else if (type === "completed") {
         setQuery = {
            $set: {
               orderStatus: "completed",
               orderCompletedAt: new Date(timestamp)
            }
         }
      }

      else if (type === "canceled" && cancelReason) {
         setQuery = {
            $set: {
               orderStatus: "canceled",
               cancelReason: cancelReason,
               orderCanceledAt: new Date(timestamp)
            }
         }
      }

      else if (type === "refunded" && refundAT) {
         setQuery = {
            $set: {
               isRefunded: true,
               refundAt: refundAT,
               orderStatus: "refunded"
            }
         }
      }

      await NCache.deleteCache(`${customerEmail}_myOrders`);

      return await Order.findOneAndUpdate({
         $and: [
            { customerId: customerId },
            { orderId: orderID }
         ]
      }, setQuery,
         { upsert: true }) ? true : false;

   } catch (error: any) {
      throw error;
   }
}


module.exports.productStockUpdater = async (type: string, data: any[]) => {
   try {

      if (!type)
         throw new Error("Required action !");


      if (!data || !Array.isArray(data))
         throw new apiResponse.Api500Error("Required product id, sku, quantity !");


      const bulkOperations = [];

      for (const item of data) {

         const filter = {
            $and: [{ productId: mdb.ObjectId(item.productId) }, { sku: item?.sku }]
         };

         // let generateSkeleton: any;

         // if (item?.productType === "single") {
         //    generateSkeleton = {
         //       stockPrice: "$stockPrice",
         //       sellPrice: "$sellPrice",
         //       discount: "$discount",
         //       attributes: "$attributes",
         //       sku: "$sku",
         //       stockQuantity: {
         //          $cond: {
         //             if: { $eq: [type, 'dec'] },
         //             then: { $max: [0, { $subtract: ['$stockQuantity', item.quantity] }] },
         //             else: { $add: ['$stockQuantity', item.quantity] },
         //          },
         //       },
         //       stock: {
         //          $cond: {
         //             if: { $lte: [{ $max: [0, { $subtract: ['$stockQuantity', item.quantity] }] }, 0] },
         //             then: 'out',
         //             else: '$stock',
         //          },
         //       },
         //    }
         // } else {
         //    generateSkeleton = {
         //       variations: {
         //          $map: {
         //             input: '$variations',
         //             as: 'var',
         //             in: {
         //                $cond: {
         //                   if: { $eq: ['$$var.sku', item.sku] },
         //                   then: {
         //                      $mergeObjects: [
         //                         '$$var',
         //                         {
         //                            stockQuantity: {
         //                               $cond: {
         //                                  if: { $eq: [type, 'dec'] },
         //                                  then: { $max: [0, { $subtract: ['$$var.stockQuantity', item.quantity] }] },
         //                                  else: { $add: ['$$var.stockQuantity', item.quantity] },
         //                               },
         //                            },
         //                            stock: {
         //                               $cond: {
         //                                  if: { $lte: [{ $max: [0, { $subtract: ['$$var.stockQuantity', item.quantity] }] }, 0] },
         //                                  then: 'out',
         //                                  else: '$$var.stock',
         //                               },
         //                            },
         //                         },
         //                      ],
         //                   },
         //                   else: '$$var',
         //                },
         //             },
         //          },

         //       }
         //    }

         // }

         const update = [
            {
               $set: {
                  stockQuantity: {
                     $cond: {
                        if: { $eq: [type, 'dec'] },
                        then: { $max: [0, { $subtract: ['$stockQuantity', item.quantity] }] },
                        else: { $add: ['$stockQuantity', item.quantity] },
                     },
                  },
                  stock: {
                     $cond: {
                        if: { $lte: [{ $max: [0, { $subtract: ['$stockQuantity', item.quantity] }] }, 0] },
                        then: 'out',
                        else: '$stock',
                     },
                  }
               }
            },
         ];

         // Push an updateOne operation into the bulkOperations array
         bulkOperations.push({
            updateOne: {
               filter,
               update,
            },
         });
      }

      // Execute the bulkWrite operation with the update operations
      return await ProductVariationTbl.bulkWrite(bulkOperations);
   } catch (error: any) {
      throw error;
   }
}


module.exports.getSupplierInformationByID = async (id: string) => {
   try {
      return await Store.find({ userId: mdb.ObjectId(id) });
   } catch (error) {
      throw error;
   }
}


module.exports.checkProductAvailability = async (productID: string, sku: String) => {
   try {

      let product = await Product.aggregate([
         { $match: { _id: mdb.ObjectId(productID) } },
         { $unwind: { path: "$variations" } },
         {
            $project: {
               sku: "$variations.sku",
               available: "$variations.available",
               stock: "$variations.stock"
            }
         },
         { $match: { $and: [{ sku }, { available: { $gte: 1 } }, { stock: 'in' }] } }
      ]);

      product = product[0];

      return product;
   } catch (error: any) {
      throw error;
   }
};


module.exports.clearCart = async (customerId: string, customerEmail: string) => {
   try {
      await NCache.deleteCache(`${customerEmail}_cartProducts`);
      return await ShoppingCartModel.deleteMany({ customerId: mdb.ObjectId(customerId) });
   } catch (error) {
      throw error;
   }
}


module.exports.updateProductPerformance = async (product: any, actionType: string) => {

   const { _id, views, ratingAverage, sales } = product as { _id: string, views: number, ratingAverage: number, sales: number };

   let viewsWeight = 0.4;
   let ratingWeight = 0.5;
   let salesWeight = 0.3;

   try {
      return await Product.findOneAndUpdate(
         { $and: [{ _id: mdb.ObjectId(_id) }, { status: "Active" }] },
         [
            {
               $set: {
                  views: actionType === "views" ? { $add: [{ $ifNull: ["$views", 0] }, 1] } : "$views",
                  sales: actionType === "sales" ? { $add: [{ $ifNull: ["$sales", 0] }, 1] } : "$sales",
                  score: {
                     $add: [
                        { $multiply: ["$views", viewsWeight] },
                        { $multiply: [{ $ifNull: ["$ratingAverage", 0] }, ratingWeight] },
                        { $multiply: [{ $ifNull: ["$sales", 0] }, salesWeight] },
                     ]

                  },
               },
            }
         ],
         { upsert: true, new: true }
      );
   } catch (error: any) {
      throw error;
   }
}


module.exports.createPaymentIntents = async (totalAmount: number, orderId: string, paymentMethodId: string, session: string, ip: any, userAgent: any) => {

   try {
      const paymentIntent = await stripe.paymentIntents.create({
         amount: (totalAmount * 100),
         currency: 'bdt',
         metadata: {
            order_id: orderId
         },
         confirm: true,
         automatic_payment_methods: { enabled: true },
         payment_method: paymentMethodId, // the PaymentMethod ID sent by your client
         return_url: 'https://example.com/order/123/complete',
         use_stripe_sdk: true,
         mandate_data: {
            customer_acceptance: {
               type: "online",
               online: {
                  ip_address: ip,
                  user_agent: userAgent //req.get("user-agent"),
               },
            },
         },
      }, { idempotencyKey: session });

      return paymentIntent;
   } catch (error: any) {
      throw error;
   }
}