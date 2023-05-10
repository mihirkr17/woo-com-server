"use strict";
const mongoDB = require("mongodb");
const { newPricingProject, basicProductProject, actualSellingPriceProject, shoppingCartProject } = require("./projection");
module.exports.product_detail_pipe = (productID, variationID) => {
    return [
        { $match: { _id: mongoDB.ObjectId(productID) } },
        {
            $addFields: {
                swatch: {
                    $map: {
                        input: {
                            $filter: {
                                input: "$variations",
                                cond: {
                                    $eq: ["$$v.status", "active"]
                                },
                                as: "v"
                            }
                        },
                        as: "variation",
                        in: { variant: "$$variation.variant", _vrid: "$$variation._vrid" }
                    }
                }
            }
        },
        { $unwind: { path: '$variations' } },
        { $match: { 'variations._vrid': variationID } },
        {
            $lookup: {
                from: 'users',
                localField: 'sellerData.sellerID',
                foreignField: '_uuid',
                as: 'user'
            }
        },
        { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$user", 0] }, "$$ROOT"] } } },
        {
            $project: {
                title: '$variations.vTitle',
                slug: 1,
                variations: 1,
                swatch: 1,
                store: 1,
                fulfilledBy: "$shipping.fulfilledBy",
                specification: 1,
                brand: 1, categories: 1,
                sellerData: 1,
                images: 1,
                rating: 1,
                ratingAverage: 1,
                save_as: 1,
                createdAt: 1,
                bodyInfo: 1,
                description: 1,
                manufacturer: 1,
                pricing: newPricingProject,
                isFreeShipping: "$shipping.isFree",
                volumetricWeight: "$packaged.volumetricWeight",
                _lid: 1
            }
        }
    ];
};
module.exports.product_detail_relate_pipe = (variationID, categories) => {
    return [
        { $unwind: { path: '$variations' } },
        {
            $match: {
                $and: [
                    { categories: { $in: categories } },
                    { "variations._vrid": { $ne: variationID } },
                    { "variations.status": "active" },
                ],
            },
        },
        { $project: basicProductProject },
        { $limit: 5 },
    ];
};
module.exports.home_store_product_pipe = (totalLimit) => {
    return [
        { $match: { save_as: 'fulfilled' } },
        {
            $addFields: {
                variations: {
                    $slice: [{
                            $filter: {
                                input: "$variations",
                                cond: { $eq: ["$$v.status", 'active'] },
                                as: "v"
                            }
                        }, 1]
                },
            }
        },
        { $unwind: { path: "$variations" } },
        { $project: basicProductProject },
        { $sort: { "variations._vrid": -1 } },
        { $limit: totalLimit }
    ];
};
module.exports.search_product_pipe = (q) => {
    return [
        { $unwind: { path: "$variations" } },
        {
            $match: {
                $and: [{ 'variations.status': "active" }, { save_as: "fulfilled" }],
                $or: [
                    { title: { $regex: q, $options: "i" } },
                    { "sellerData.storeName": { $regex: q, $options: "i" } },
                    { brand: { $regex: q, $options: "i" } },
                    { categories: { $in: [q] } },
                ],
            },
        },
        {
            $project: {
                title: "$variations.vTitle",
                categories: 1,
                _vrid: "$variations._vrid",
                image: { $first: "$images" },
                slug: 1,
                _lid: 1
            },
        },
    ];
};
module.exports.ctg_filter_product_pipe = (category) => {
    return [
        {
            $match: { categories: { $all: category } }
        },
        {
            $addFields: {
                variations: {
                    $slice: [{
                            $filter: {
                                input: "$variations",
                                cond: { $and: [{ $eq: ["$$v.status", 'active'] }, { $eq: ["$$v.stock", "in"] }] },
                                as: "v"
                            }
                        }, 1]
                },
            },
        },
        { $unwind: { path: "$variations" } },
        {
            $project: {
                _id: 0,
                brand: 1,
                variant: "$variations.variant"
            }
        }
    ];
};
module.exports.ctg_main_product_pipe = (category, filterByBrand, filterByPriceRange, sorting) => {
    return [
        { $match: { categories: { $all: category } } },
        {
            $addFields: {
                variations: {
                    $slice: [{
                            $filter: {
                                input: "$variations",
                                cond: { $and: [{ $eq: ["$$v.status", 'active'] }, { $eq: ["$$v.stock", "in"] }] },
                                as: "v"
                            }
                        }, 1]
                },
            }
        },
        { $unwind: { path: '$variations' } },
        { $match: filterByBrand },
        { $project: basicProductProject },
        { $match: filterByPriceRange },
        sorting
    ];
};
module.exports.single_purchase_pipe = (productID, listingID, variationID, quantity) => {
    return [
        { $match: { _lid: listingID } },
        { $unwind: { path: "$variations" } },
        { $match: { $and: [{ 'variations._vrid': variationID }, { 'variations.stock': "in" }, { 'variations.status': "active" }] } },
        {
            $project: {
                _id: 0,
                title: "$variations.vTitle",
                slug: 1,
                variations: 1,
                brand: 1,
                packaged: 1,
                image: { $first: "$images" },
                sku: "$variations.sku",
                sellerData: 1,
                shipping: 1,
                savingAmount: { $multiply: [{ $subtract: ["$pricing.price", actualSellingPriceProject] }, quantity] },
                baseAmount: { $multiply: [actualSellingPriceProject, quantity] },
                sellingPrice: actualSellingPriceProject,
                paymentInfo: 1,
                variant: "$variations.variant",
                available: "$variations.available",
                stock: "$variations.stock",
                productID,
                listingID,
                variationID
            }
        }, { $set: { quantity } }, {
            $unset: ["variations"]
        }
    ];
};
module.exports.shopping_cart_pipe = (email) => {
    return [
        { $match: { customerEmail: email } },
        { $unwind: { path: "$items" } },
        {
            $lookup: {
                from: 'products',
                localField: "items.listingID",
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
                        { $eq: ['$variations._vrid', '$items.variationID'] },
                        { $eq: ["$variations.stock", "in"] },
                        { $eq: ["$variations.status", "active"] },
                        { $eq: ["$save_as", "fulfilled"] }
                    ]
                }
            }
        },
        {
            $project: shoppingCartProject
        },
        {
            $unset: ["variations", "items"]
        }
    ];
};
