import { NextFunction, Request, Response } from "express";
const ShoppingCart = require("../../model/shoppingCart.model");
const User = require("../../model/user.model");

module.exports.getCartContext = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const authEmail = req.decoded.email;
      const role = req.decoded.role;

      let result = await User.findOne(
         {
            $and: [{ email: authEmail }, { role: role }, { accountStatus: 'active' }]
         },
         {
            password: 0, createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
         }
      );
      let defaultShippingAddress;

      let areaType = (Array.isArray(result?.buyer?.shippingAddress) &&
         result?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);
      defaultShippingAddress = areaType;
      areaType = areaType?.area_type;

      const spC = await ShoppingCart.aggregate([
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
                     { $eq: ["$variations.stock", "in"] },
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



      if (typeof spC === "object") {

         const totalAmounts = spC && spC.map((tAmount: any) => (parseFloat(tAmount?.totalAmount))).reduce((p: any, c: any) => p + c, 0).toFixed(2);
         const totalQuantities = spC && spC.map((tQuant: any) => (parseFloat(tQuant?.quantity))).reduce((p: any, c: any) => p + c, 0).toFixed(0);
         const shippingFees = spC && spC.map((p: any) => parseFloat(p?.shippingCharge)).reduce((p: any, c: any) => p + c, 0).toFixed(2);
         const finalAmounts = spC && spC.map((fAmount: any) => (parseFloat(fAmount?.totalAmount) + fAmount?.shippingCharge)).reduce((p: any, c: any) => p + c, 0).toFixed(2);

         let shoppingCartData = {
            products: spC,
            container_p: {
               totalAmounts,
               totalQuantities,
               finalAmounts,
               shippingFees,
            },
            numberOfProducts: spC.length || 0,
            defaultShippingAddress
         }

         return res.status(200).send({ success: true, statusCode: 200, data: { module: shoppingCartData } });
      }
   } catch (error: any) {
      next(error);
   }
}