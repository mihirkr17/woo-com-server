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
const ShoppingCart = require("../../model/shoppingCart.model");
// Show My Cart Items;
module.exports.showMyCartItemsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const db = yield dbConnection();
        const authEmail = req.decoded.email;
        const role = req.decoded.role;
        let user = yield User.findOne({
            $and: [{ email: authEmail }, { role: role }, { accountStatus: 'active' }]
        }, {
            password: 0, createdAt: 0,
            phonePrefixCode: 0,
            becomeSellerAt: 0
        });
        let areaType = (Array.isArray((_a = user === null || user === void 0 ? void 0 : user.buyer) === null || _a === void 0 ? void 0 : _a.shippingAddress) &&
            ((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
        areaType = areaType === null || areaType === void 0 ? void 0 : areaType.area_type;
        const result = yield ShoppingCart.aggregate([
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
        if (Array.isArray(result) && typeof result === "object") {
            const totalAmounts = result && result.map((tAmount) => (parseFloat(tAmount === null || tAmount === void 0 ? void 0 : tAmount.totalAmount))).reduce((p, c) => p + c, 0).toFixed(2);
            const totalQuantities = result && result.map((tQuant) => (parseFloat(tQuant === null || tQuant === void 0 ? void 0 : tQuant.quantity))).reduce((p, c) => p + c, 0).toFixed(0);
            const shippingFees = result && result.map((p) => parseFloat(p === null || p === void 0 ? void 0 : p.shippingCharge)).reduce((p, c) => p + c, 0).toFixed(2);
            const finalAmounts = result && result.map((fAmount) => (parseFloat(fAmount === null || fAmount === void 0 ? void 0 : fAmount.totalAmount) + (fAmount === null || fAmount === void 0 ? void 0 : fAmount.shippingCharge))).reduce((p, c) => p + c, 0).toFixed(2);
            let shoppingCartData = {
                products: result,
                container_p: {
                    totalAmounts,
                    totalQuantities,
                    finalAmounts,
                    shippingFees,
                },
                numberOfProducts: result.length || 0
            };
            return res.status(200).send({ success: true, statusCode: 200, data: shoppingCartData });
        }
    }
    catch (error) {
        return res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
