"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { dbConnection } = require("../../utils/db");
// Show My Cart Items;
module.exports.showMyCartItemsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const authEmail = req.decoded.email;
        const cartItems = yield db.collection('shoppingCarts').find({ customerEmail: authEmail }).toArray();
        const result = yield db.collection('shoppingCarts').aggregate([
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
                            { $eq: ['$variations.vId', '$variationId'] }
                        ]
                    }
                }
            },
            {
                $project: {
                    listingId: 1,
                    productId: 1, variationId: 1, variations: 1, brand: 1,
                    quantity: 1,
                    totalAmount: { $multiply: ['$variations.pricing.sellingPrice', '$quantity'] },
                    seller: 1,
                    shippingCharge: "$deliveryDetails.zonalDeliveryCharge",
                    paymentInfo: 1
                }
            }
        ]).toArray();
        if (cartItems) {
            return res.status(200).send({ success: true, statusCode: 200, data: { items: cartItems.length, products: result, result: result } });
        }
    }
    catch (error) {
        return res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
