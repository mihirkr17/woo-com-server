// common.services.tsx
const mdb = require("mongodb");
const Product = require("../model/product.model");
const UserModel = require("../model/user.model");
const OrderModel = require("../model/order.model");
const OrderTable = require("../model/orderTable.model");
const ShoppingCartModel = require("../model/shoppingCart.model");
const cryptos = require("crypto");
const apiResponse = require("../errors/apiResponse");
const { generateTrackingID } = require("../utils/generator");
const NCache = require("../utils/NodeCache");
const Order = require("../model/order.model");
const Supplier = require("../model/supplier.model");
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
      ) || null;
   } catch (error: any) {
      return error;
   }
}


module.exports.findUserByUUID = async (uuid: string) => {
   try {
      return await UserModel.findOne(
         { $and: [{ _uuid: uuid }, { accountStatus: 'Active' }] },
         {
            password: 0,
            createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
         }
      ) || null;
   } catch (error: any) {
      return error;
   }
}

module.exports.order_status_updater = async (obj: any) => {
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
      return error?.message;
   }
}


module.exports.update_variation_stock_available = async (type: string, data: any[]) => {
   try {

      if (!type) {
         throw new Error("Required action !");
      }

      if (!data || !Array.isArray(data)) {

         throw new apiResponse.Api500Error("Required product id, sku, quantity !");
         // throw new Error("Required product id, sku, quantity !");
      }

      const bulkOperations = [];

      for (const item of data) {

         const filter = {
            _id: mdb.ObjectId(item.productId),
         };

         const update = [
            {
               $set: {
                  variations: {
                     $map: {
                        input: '$variations',
                        as: 'var',
                        in: {
                           $cond: {
                              if: { $eq: ['$$var.sku', item.sku] },
                              then: {
                                 $mergeObjects: [
                                    '$$var', // Preserve existing fields
                                    {
                                       available: {
                                          $cond: {
                                             if: { $eq: [type, 'dec'] },
                                             then: { $max: [0, { $subtract: ['$$var.available', item.quantity] }] },
                                             else: { $add: ['$$var.available', item.quantity] },
                                          },
                                       },
                                       stock: {
                                          $cond: {
                                             if: { $lte: [{ $max: [0, { $subtract: ['$$var.available', item.quantity] }] }, 0] },
                                             then: 'out',
                                             else: '$$var.stock',
                                          },
                                       },
                                    },
                                 ],
                              },
                              else: '$$var',
                           },
                        },
                     },
                  },
               },
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
      return await Product.bulkWrite(bulkOperations);
   } catch (error: any) {
      throw error;
   }
}


module.exports.getSupplierInformationByID = async (uuid: string) => {
   return await Supplier.findOne({ _id: mdb.ObjectId(uuid) }, { password: 0 });
}


module.exports.checkProductAvailability = async (productID: string, sku: String) => {

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
};


module.exports.clearCart = async (customerId: string, customerEmail: string) => {
   await NCache.deleteCache(`${customerEmail}_cartProducts`);
   return await ShoppingCartModel.deleteMany({ customerId: mdb.ObjectId(customerId) });
}


module.exports.updateProductPerform = async (product: any, actionType: string) => {

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
      console.log(error);
   }

   // let totalViews = actionType === "views" ? views + 1 : views;

   // let totalSales = actionType === "sales" ? sales + 1 : sales;

   // let score = (totalViews * viewsWeight) + (ratingAverage * ratingWeight) + (totalSales * salesWeight);



   // try {
   //    return await Product.findOneAndUpdate({ $and: [{ _id: mdb.ObjectId(_id) }, { status: "Active" }] }, {
   //       $set: {
   //          views: totalViews,
   //          score: score
   //       }
   //    }, { upsert: true });
   // } catch (error: any) {

   // }
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

   }
}