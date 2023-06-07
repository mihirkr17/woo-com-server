"use strict";
const mongoDB = require("mongodb");
const { newPricingProject, basicProductProject, actualSellingPriceProject, shoppingCartProject } = require("./projection");
module.exports.store_products_pipe = (page, Filter, sortList) => {
    page = parseInt(page);
    page = page === 1 ? 0 : page - 1;
    return [
        {
            $match: Filter
        },
        {
            $addFields: {
                variations: {
                    $ifNull: [{ $arrayElemAt: ["$variations", 0] }, null]
                }
            }
        },
        { $project: basicProductProject },
        sortList,
        { $skip: 1 * page },
        { $limit: 1 }
    ];
};
module.exports.product_detail_pipe = (productID, variationID) => {
    return [
        { $match: { $and: [{ _id: mongoDB.ObjectId(productID) }, { status: "active" }] } },
        {
            $addFields: {
                swatch: {
                    $map: {
                        input: "$variations",
                        as: "variation",
                        in: {
                            variant: "$$variation.variant",
                            _vrid: "$$variation._vrid",
                            image: { $first: "$$variation.images" }
                        }
                    }
                },
                variations: {
                    $ifNull: [
                        {
                            $arrayElemAt: [{
                                    $filter: {
                                        input: "$variations",
                                        as: "variation",
                                        cond: { $eq: ["$$variation._vrid", variationID] }
                                    }
                                }, 0]
                        },
                        {}
                    ]
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'supplier.id',
                foreignField: '_uuid',
                as: 'user'
            }
        },
        { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$user", 0] }, "$$ROOT"] } } },
        {
            $project: {
                title: "$variations.vTitle",
                slug: 1,
                variations: 1,
                swatch: 1,
                store: 1,
                fulfilledBy: "$shipping.fulfilledBy",
                specification: 1,
                brand: 1,
                status: 1,
                score: 1,
                sales: 1,
                views: 1,
                categories: 1,
                supplier: 1,
                images: {
                    $concatArrays: [["$image"], "$variations.images"]
                },
                rating: 1,
                ratingAverage: 1,
                ratingCount: {
                    $reduce: {
                        input: "$rating",
                        initialValue: 0,
                        in: { $add: ["$$value", "$$this.count"] }
                    }
                },
                save_as: 1,
                createdAt: 1,
                bodyInfo: 1,
                description: 1,
                manufacturer: 1,
                highlights: 1,
                pricing: newPricingProject,
                isFreeShipping: "$shipping.isFree",
                volumetricWeight: "$packaged.volumetricWeight",
                weight: "$packaged.weight",
                weightUnit: "$packaged.weightUnit",
                _lid: 1
            }
        },
        {
            $set: { "supplier.contact_numbers": "$store.phones", store: 0, }
        }
    ];
};
module.exports.product_detail_relate_pipe = (variationID, categories) => {
    return [
        { $match: { $and: [{ categories: { $in: categories } }, { status: "active" }] } },
        { $unwind: { path: '$variations' } },
        { $match: { "variations._vrid": { $ne: variationID } } },
        { $project: basicProductProject },
        { $limit: 10 },
    ];
};
module.exports.home_store_product_pipe = (totalLimit) => {
    return [
        { $match: { $and: [{ save_as: 'fulfilled' }, { status: "active" }] } },
        {
            $addFields: {
                variations: {
                    $ifNull: [{ $arrayElemAt: ["$variations", { $floor: { $multiply: [{ $rand: {} }, { $size: "$variations" }] } }] }, null]
                }
            }
        },
        { $project: basicProductProject },
        { $sort: { "variations._vrid": -1 } },
        { $limit: totalLimit },
        { $sample: { size: totalLimit !== null && totalLimit !== void 0 ? totalLimit : 6 } }
    ];
};
module.exports.search_product_pipe = (q) => {
    return [
        { $match: { $and: [{ save_as: "fulfilled" }, { status: "active" }] } },
        { $unwind: { path: "$variations" } },
        {
            $match: {
                $or: [
                    { title: { $regex: q, $options: "i" } },
                    { "supplier.store_name": { $regex: q, $options: "i" } },
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
        { $match: { $and: [{ _lid: listingID }, { status: "active" }] } },
        { $unwind: { path: "$variations" } },
        { $match: { $and: [{ 'variations._vrid': variationID }, { 'variations.stock': "in" }] } },
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
                supplier: 1,
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
                        { $eq: ["$status", "active"] },
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
