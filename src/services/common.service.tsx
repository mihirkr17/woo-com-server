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
      const { customerEmail, type, orderID, cancelReason, refundAT, sellerEmail } = obj;

      let setQuery: any = {};
      const timestamp = Date.now();

      let timePlan = {
         iso: new Date(timestamp),
         time: new Date(timestamp).toLocaleTimeString(),
         date: new Date(timestamp).toDateString(),
         timestamp: timestamp
      };

      if (type === "dispatch") {
         // await Promise.all(items.map(async (item: any) => {

         //    return await OrderTable.findOneAndUpdate({
         //       $and: [
         //          { customerEmail }, { orderID },
         //          { "seller.email": sellerEmail }]
         //    }, {
         //       $set: {
         //          "items.$[i].tracking_id": generateTrackingID()
         //       }
         //    },
         //       { arrayFilters: [{ "i.itemID": item?.itemID }], upsert: true });
         // }));

         setQuery = {
            $set: {
               order_status: "dispatch",
               order_dispatched_at: timePlan,
               is_dispatched: true,
               tracking_id: generateTrackingID()
            }
         }
      }

      else if (type === "shipped") {
         setQuery = {
            $set: {
               order_status: "shipped",
               order_shipped_at: timePlan,
               is_shipped: true
            }
         }
      }

      else if (type === "completed") {
         setQuery = {
            $set: {
               order_status: "completed",
               is_completed_at: timePlan,
               is_completed: true
            }
         }
      }

      else if (type === "canceled" && cancelReason) {
         setQuery = {
            $set: {
               order_status: "canceled",
               cancel_reason: cancelReason,
               order_canceled_at: timePlan,
               is_canceled: true
            }
         }
      }

      else if (type === "refunded" && refundAT) {
         setQuery = {
            $set: {
               is_refunded: true,
               refund_at: refundAT,
               order_status: "refunded"
            }
         }
      }

      await NCache.deleteCache(`${customerEmail}_myOrders`);

      return await Order.findOneAndUpdate({
         $and: [
            { "customer.email": customerEmail },
            { order_id: orderID },
            { "supplier.email": sellerEmail }
         ]
      }, setQuery,
         { upsert: true }) ? true : false;

   } catch (error: any) {
      return error?.message;
   }
}


module.exports.get_product_variation = async (data: any) => {
   try {

      let variation = await Product.aggregate([
         { $match: { $and: [{ _lid: data?.listingID }, { _id: mdb.ObjectId(data?.productID) }] } },
         { $unwind: { path: "$variations" } },
         { $project: { variations: 1 } },
         { $match: { $and: [{ "variations.sku": data?.sku }] } },
         { $replaceRoot: { newRoot: { $mergeObjects: ["$variations", "$$ROOT"] } } },
         { $unset: ["variations"] }
      ]);

      if (variation) {
         return variation[0];
      }

   } catch (error: any) {
      return error;
   }
};


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


module.exports.is_product = async (productID: string, sku: string) => {
   try {
      return await Product.countDocuments({
         $and: [
            { _id: mdb.ObjectId(productID) },
            { variations: { $elemMatch: { sku } } }
         ]
      }) || 0;
   } catch (error: any) {
      return error;
   }
}


module.exports.productCounter = async (sellerInfo: any) => {
   try {

      async function cps(saveAs: string = "") {
         let f;

         if (sellerInfo) {
            f = {
               "supplier.email": sellerInfo?.email
            }
         } else {
            f = {};
         }
         return await Product.countDocuments(f);
      }

      let totalProducts: Number = await cps();


      let inactiveProducts: Number = await cps("Inactive");

      const setData = await UserModel.updateOne({ $and: [{ _uuid: sellerInfo?._uuid }, { role: 'SELLER' }] }, {
         $set: {
            "store.info.numOfProduct": totalProducts,
            "store.info.inactiveProducts": inactiveProducts
         }
      }, {});

      if (setData) return true;

   } catch (error: any) {
      return error;
   }
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


module.exports.updateProductInformation = async (product: any, option: any) => {

   const { _id, views, ratingAverage, sales } = product;

   let viewsWeight = 0.4;
   let ratingWeight = 0.5;
   let salesWeight = 0.3;

   let totalViews = option?.actionType === "views" ? ((views ?? 0) + 1) : (views ?? 0);
   let totalSales = option?.actionType === "sales" ? (sales ?? 0) + 1 : (sales ?? 0);

   let score = (totalViews * viewsWeight) + (ratingAverage * ratingWeight) + (totalSales * salesWeight);

   try {
      await Product.findOneAndUpdate({ $and: [{ _id: mdb.ObjectId(_id) }, { status: "Active" }] }, {
         $set: {
            views: totalViews,
            score: score
         }
      }, { upsert: true });

      return { request: "Request success..." };
   } catch (error: any) {
      return error;
   }
}


module.exports.createPaymentIntents = async (totalAmount: number, orderId: string, paymentMethodId: string, session: string, ip: any, userAgent: any) => {

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
}