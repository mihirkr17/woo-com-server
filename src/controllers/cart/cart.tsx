import { NextFunction, Request, Response } from "express";
const ShoppingCart = require("../../model/shoppingCart.model");
const { findUserByEmail, actualSellingPrice, calculateShippingCost } = require("../../services/common.services");

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
               foreignField: "_lid",
               as: "main_product"
            }
         },
         { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
         { $project: { main_product: 0 } },
         { $unwind: { path: "$variations" } },
         {
            $match: {
               $expr: {
                  $and: [
                     { $eq: ['$variations._vrid', '$variationID'] },
                     { $eq: ["$variations.stock", "in"] },
                     { $eq: ["$variations.status", "active"] },
                     { $eq: ["$save_as", "fulfilled"] }
                  ]
               }
            }
         },
         {
            $project: {
               cartID: "$_id",
               dim: 1,
               _id: 0,
               title: "$variations.vTitle",
               slug: 1,
               package: 1,
               listingID: 1,
               productID: 1,
               customerEmail: 1,
               variationID: 1,
               variations: 1,
               shipping: 1,
               brand: 1,
               image: { $first: "$images" },
               sku: "$variations.sku",
               sellerData: 1,
               quantity: 1,
               savingAmount: { $multiply: [{ $subtract: ["$pricing.price", actualSellingPrice] }, '$quantity'] },
               baseAmount: { $multiply: [actualSellingPrice, '$quantity'] },
               paymentInfo: 1,
               sellingPrice: actualSellingPrice,
               variant: "$variations.variant",
               available: "$variations.available",
               stock: "$variations.stock"
            }
         },
         {
            $unset: ["variations"]
         }
      ]);



      if (typeof cart === "object") {

         cart && cart.map((p: any) => {

            if (p?.shipping?.isFree && p?.shipping?.isFree) {
               p["shippingCharge"] = 0;
            } else {
               p["shippingCharge"] = calculateShippingCost(p?.package?.volumetricWeight, areaType);
            }

            return p;
         });

         const baseAmounts = cart && cart.map((tAmount: any) => (parseInt(tAmount?.baseAmount))).reduce((p: any, c: any) => p + c, 0);
         const totalQuantities = cart && cart.map((tQuant: any) => (parseInt(tQuant?.quantity))).reduce((p: any, c: any) => p + c, 0);
         const shippingFees = cart && cart.map((p: any) => parseInt(p?.shippingCharge)).reduce((p: any, c: any) => p + c, 0);
         const finalAmounts = cart && cart.map((fAmount: any) => (parseInt(fAmount?.baseAmount) + fAmount?.shippingCharge)).reduce((p: any, c: any) => p + c, 0);
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