"use strict";
const discount = {
    $toInt: {
        $multiply: [
            {
                $divide: [
                    {
                        $subtract: ["$pricing.price", {
                                $add: ["$pricing.sellingPrice", "$variations.priceModifier"]
                            }]
                    }, "$pricing.price"
                ]
            }, 100
        ]
    }
};
module.exports.basicProductProject = {
    title: 1,
    slug: 1,
    imageUrl: { $arrayElemAt: ["$variations.images", 0] },
    brand: 1,
    score: 1,
    sales: 1,
    views: 1,
    categories: 1,
    packageInfo: 1,
    rating: 1,
    ratingAverage: 1,
    ratingCount: {
        $reduce: {
            input: "$rating",
            initialValue: 0,
            in: { $add: ["$$value", "$$this.count"] }
        }
    },
    _lid: 1,
    reviews: 1,
    sku: "$variations.sku",
    stock: "$variations.stock",
    variant: "$variations.variant",
    shipping: 1,
    pricing: "$variations.pricing"
};
module.exports.shoppingCartProject = {
    cartID: "$_id",
    _id: 0,
    asset: 1,
    title: 1,
    slug: 1,
    listingID: "$items.listingID",
    productID: "$items.productID",
    customerEmail: 1,
    brand: 1,
    shipping: "$shipping.isFree",
    packaged: 1,
    imageUrl: { $arrayElemAt: ["$variations.images", 0] },
    sku: "$variations.sku",
    quantity: "$items.quantity",
    savingAmount: { $multiply: [{ $subtract: ["$variations.pricing.price", "$variations.pricing.sellingPrice"] }, '$items.quantity'] },
    baseAmount: { $multiply: ["$variations.pricing.sellingPrice", '$items.quantity'] },
    paymentInfo: 1,
    sellingPrice: "$variations.pricing.sellingPrice",
    price: "$variations.pricing.price",
    variant: "$variations.variant",
    available: "$variations.available",
    stock: "$variations.stock"
};
