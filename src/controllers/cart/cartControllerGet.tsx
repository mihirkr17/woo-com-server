import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");


// Show My Cart Items;
module.exports.showMyCartItemsController = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const authEmail = req.decoded.email;

    const cartItems = await db.collection('shoppingCarts').find({ customerEmail: authEmail }).toArray();

    const result = await db.collection('shoppingCarts').aggregate([
      { $match: { customerEmail: authEmail } },
      {
        $lookup: {
          from: 'products',
          localField: 'listingId',
          foreignField: "_lId",
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
              { $eq: ['$variations._vId', '$variationId'] },
              { $eq: ["$variations.stock", "in"] },
              { $eq: ["$save_as", "fulfilled"] }
            ]
          }
        }
      },
      {
        $project: {
          title: 1,
          slug: 1,
          listingId: 1,
          productId: 1, variationId: 1, variations: 1, brand: 1,
          quantity: 1,
          totalAmount: { $multiply: ['$variations.pricing.sellingPrice', '$quantity'] },
          seller: 1,
          shippingCharge: "$shipping.delivery.zonalCharge",
          paymentInfo: 1
        }
      }
    ]).toArray();

    if (Array.isArray(result) && typeof result === "object") {

      const totalAmounts = result && result.map((tAmount: any) => (parseFloat(tAmount?.totalAmount))).reduce((p: any, c: any) => p + c, 0).toFixed(2);
      const totalQuantities = result && result.map((tQuant: any) => (parseFloat(tQuant?.quantity))).reduce((p: any, c: any) => p + c, 0).toFixed(0);
      const shippingFees = result && result.map((p: any) => parseFloat(p?.shippingCharge)).reduce((p: any, c: any) => p + c, 0).toFixed(2);
      const finalAmounts = result && result.map((fAmount: any) => (parseFloat(fAmount?.totalAmount) + fAmount?.shippingCharge)).reduce((p: any, c: any) => p + c, 0).toFixed(2);

      const data = {
        products: result,
        container_p: {
          totalAmounts,
          totalQuantities,
          finalAmounts,
          shippingFees,
        },
        numberOfProducts: result.length || 0
      }

      return res.status(200).send({ success: true, statusCode: 200, data });
    }

  } catch (error: any) {
    return res.status(500).send({ success: false, statusCode: 500, error: error?.message })
  }
}