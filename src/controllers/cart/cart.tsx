import { NextFunction, Request, Response } from "express";
const ShoppingCart = require("../../model/shoppingCart.model");
const { findUserByEmail } = require("../../services/common.services");

module.exports.getCartContext = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const authEmail = req.decoded.email;

      let user = await findUserByEmail(authEmail);

      if (!user) {
         return res.status(503).send({ success: false, statusCode: 503, message: "Service unavailable !" });
      }

      let defaultShippingAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
         user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

      let areaType = defaultShippingAddress?.area_type || "";

      const cart = await ShoppingCart.aggregate([
         { $match: { customerEmail: authEmail } },
         {
            $lookup: {
               from: 'products',
               localField: 'listingID',
               foreignField: "_LID",
               as: "main_product"
            }
         },
         {
            $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } }
         },
         { $project: { main_product: 0 } },
         { $unwind: { path: "$variations" } },
         {
            $match: {
               $expr: {
                  $and: [
                     { $eq: ['$variations._VID', '$variationID'] },
                     // { $eq: ["$variations.stock", "in"] },
                     { $eq: ["$variations.status", "active"] },
                     { $eq: ["$save_as", "fulfilled"] }
                  ]
               }
            }
         },
         {
            $project: {
               cartID: "$_id",
               _id: 0,
               title: 1,
               slug: 1,
               listingID: 1,
               productID: 1,
               customerEmail: 1,
               variationID: 1,
               variations: 1,
               brand: 1,
               image: { $first: "$variations.images" },
               sku: "$variations.sku",
               sellerData: 1,
               quantity: 1,
               shippingCharge: {
                  $switch: {
                     branches: [
                        { case: { $eq: [areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                        { case: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                     ],
                     default: "$shipping.delivery.zonalCharge"
                  }
               },
               savingAmount: { $multiply: [{ $subtract: ["$variations.pricing.price", "$variations.pricing.sellingPrice"] }, '$quantity'] },
               baseAmount: { $multiply: ['$variations.pricing.sellingPrice', '$quantity'] },
               totalAmount: {
                  $add: [
                     { $multiply: ['$variations.pricing.sellingPrice', '$quantity'] },
                     {
                        $switch: {
                           branches: [
                              { case: { $eq: [areaType, "zonal"] }, then: "$shipping.delivery.zonalCharge" },
                              { case: { $eq: [areaType, "local"] }, then: "$shipping.delivery.localCharge" }
                           ],
                           default: "$shipping.delivery.zonalCharge"
                        }
                     }
                  ]
               },
               paymentInfo: 1,
               sellingPrice: "$variations.pricing.sellingPrice",
               variant: "$variations.variant",
               stock: "$variations.stock"
            }
         }, {
            $unset: ["variations"]
         }
      ]);



      if (typeof cart === "object") {

         const baseAmounts = cart && cart.map((tAmount: any) => (parseInt(tAmount?.baseAmount))).reduce((p: any, c: any) => p + c, 0);
         const totalQuantities = cart && cart.map((tQuant: any) => (parseInt(tQuant?.quantity))).reduce((p: any, c: any) => p + c, 0);
         const shippingFees = cart && cart.map((p: any) => parseInt(p?.shippingCharge)).reduce((p: any, c: any) => p + c, 0);
         const finalAmounts = cart && cart.map((fAmount: any) => (parseInt(fAmount?.totalAmount))).reduce((p: any, c: any) => p + c, 0);
         const savingAmounts = cart && cart.map((fAmount: any) => (parseInt(fAmount?.savingAmount))).reduce((p: any, c: any) => p + c, 0);

         let shoppingCartData = {
            products: cart,
            container_p: {
               baseAmounts,
               totalQuantities,
               finalAmounts,
               shippingFees,
               savingAmounts
            },
            numberOfProducts: cart.length || 0,
            defaultShippingAddress
         }

         return res.status(200).send({ success: true, statusCode: 200, data: { module: shoppingCartData } });
      }
   } catch (error: any) {
      next(error);
   }
}