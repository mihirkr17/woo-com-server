"use strict";
const mongoDB = require("mongodb");
const { basicProductProject } = require("./projection");
const productTypeSingle = {
    title: "$title",
    image: { $arrayElemAt: ["$images", 0] },
    stockPrice: "$stockPrice",
    sellPrice: "$sellPrice",
    discount: "$discount",
    attributes: "$attributes",
    stockQuantity: "$stockQuantity",
    stock: "$stock",
    sku: "$sku"
};
const variationTables = {
    $lookup: {
        from: 'PRODUCT_VARIATION_TBL',
        localField: "_id",
        foreignField: "productId",
        as: "variations"
    }
};
const variationTable = {
    $lookup: {
        from: 'PRODUCT_VARIATION_TBL',
        localField: "_id",
        foreignField: "productId",
        as: "variation"
    }
};
const basicProductQuery = [
    {
        $lookup: {
            from: "PRODUCT_VARIATION_TBL",
            let: { mainProductId: "$_id" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$productId", "$$mainProductId"] },
                                { $eq: ["$stock", "in"] }
                            ]
                        }
                    }
                },
                { $project: { productId: 0, _id: 0 } }
            ],
            as: "variations"
        }
    },
    {
        $replaceRoot: {
            newRoot: {
                $mergeObjects: [{
                        $arrayElemAt: [
                            {
                                $ifNull: [{
                                        $filter: {
                                            input: "$variations",
                                            as: "variation",
                                            cond: { $eq: ["$$variation.stock", "in"] }
                                        }
                                    }, []]
                            },
                            0
                        ]
                    }, "$$ROOT"]
            }
        }
    },
    {
        $project: {
            variations: 0
        }
    },
    {
        $match: { stock: "in" }
    },
    {
        $project: {
            title: { $ifNull: ["$title", "$title"] },
            slug: 1,
            image: "$mainImage",
            brand: 1,
            score: 1,
            sales: 1,
            views: 1,
            categories: 1,
            ratingAverage: 1,
            ratingCount: 1,
            sku: "$sku",
            stock: "$stock",
            attributes: "$attributes",
            shipping: 1,
            stockPrice: "$stockPrice",
            sellPrice: "$sellPrice",
            link: 1
        }
    },
];
module.exports.store_products_pipe = (page, Filter, sortList) => {
    page = parseInt(page);
    page = page === 1 ? 0 : page - 1;
    return [
        { $match: { $and: [{ status: "Active" }, { isVerified: true }] } },
        ...basicProductQuery,
        sortList,
        { $skip: 1 * page },
        { $limit: 1 }
    ];
};
module.exports.product_detail_pipe = (productId, sku) => {
    return [
        { $match: { $and: [{ _id: mongoDB.ObjectId(productId) }, { status: "Active" }] } },
        variationTables,
        {
            $addFields: {
                swatch: {
                    $cond: {
                        if: { $eq: ["$productType", "single"] },
                        then: [],
                        else: {
                            $map: {
                                input: "$variations",
                                as: "vars",
                                in: {
                                    attributes: "$$vars.attributes",
                                    sku: "$$vars.sku",
                                    stock: "$$vars.stock"
                                }
                            }
                        }
                    }
                },
                variation: {
                    $arrayElemAt: [{
                            $filter: {
                                input: "$variations",
                                as: "vars",
                                cond: { $eq: ["$$vars.sku", sku] }
                            }
                        }, 0]
                }
            }
        },
        {
            $lookup: {
                from: 'SUPPLIER_TBL',
                localField: 'supplierId',
                foreignField: '_id',
                as: 'supplier'
            }
        },
        { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$supplier", 0] }, "$$ROOT"] } } },
        {
            $project: {
                title: { $ifNull: ["$variation.title", "$title"] },
                slug: 1,
                swatch: 1,
                variation: 1,
                fulfilledBy: "$shipping.fulfilledBy",
                specification: 1,
                brand: 1,
                status: 1,
                score: 1,
                sales: 1,
                views: 1,
                categoriesFlat: 1,
                supplierId: 1,
                storeTitle: "$storeInformation.companyName",
                supplierPhone: "$personalInformation.phone",
                images: "$variation.images",
                rating: 1,
                ratingAverage: 1,
                ratingCount: 1,
                metaDescription: 1,
                description: 1,
                manufacturer: 1,
                highlights: 1,
                volumetricWeight: "$packaged.volumetricWeight",
                weight: "$packaged.weight",
                weightUnit: "$packaged.weightUnit"
            }
        }
    ];
};
module.exports.product_detail_relate_pipe = (productId, categories) => {
    return [
        { $match: { $and: [{ categories: { $in: categories } }, { _id: { $ne: mongoDB.ObjectId(productId) } }, { status: "Active" }] } },
        ...basicProductQuery,
        {
            $limit: 10
        },
    ];
};
module.exports.home_store_product_pipe = (totalLimit) => {
    return [
        { $match: { $and: [{ status: "Active" }, { isVerified: true }] } },
        ...basicProductQuery,
        {
            $limit: totalLimit
        }
    ];
};
module.exports.search_product_pipe = (q) => {
    return [
        { $match: { status: "Active" } },
        { $unwind: { path: "$variations" } },
        {
            $match: {
                $or: [
                    { title: { $regex: q, $options: "i" } },
                    { brand: { $regex: q, $options: "i" } },
                    { categories: { $in: [q] } },
                ],
            },
        },
        {
            $project: {
                title: 1,
                categories: 1,
                sku: "$variations.sku",
                imageUrl: { $arrayElemAt: ["$imageUrls", 0] },
                slug: 1
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
                    $arrayElemAt: [{
                            $filter: {
                                input: "$variations",
                                cond: { $eq: ["$$v.stock", "in"] },
                                as: "v"
                            }
                        }, 0]
                },
            },
        },
        {
            $project: {
                _id: 0,
                brand: 1,
                variant: "$variations.variant"
            }
        }
    ];
};
module.exports.ctg_main_product_pipe = (filters, sorting) => {
    return [
        { $match: filters },
        {
            $addFields: {
                variation: {
                    $cond: {
                        if: { $eq: ["$productType", "single"] },
                        then: productTypeSingle,
                        else: {
                            $arrayElemAt: [{
                                    $filter: {
                                        input: "$variations",
                                        cond: { $eq: ["$$v.stock", "in"] },
                                        as: "v"
                                    }
                                }, 0]
                        }
                    }
                },
            },
        },
        { $project: basicProductProject },
        sorting
    ];
};
module.exports.single_purchase_pipe = (productId, sku, quantity) => {
    return [
        { $match: { $and: [{ _id: mongoDB.ObjectId(productId) }, { status: "Active" }] } },
        {
            $addFields: {
                variation: {
                    $cond: {
                        if: { $eq: ["$productType", "single"] },
                        then: productTypeSingle,
                        else: {
                            $arrayElemAt: [{
                                    $filter: {
                                        input: "$variations",
                                        cond: { $eq: ['$$variation.sku', sku] },
                                        as: "variation"
                                    }
                                }, 0]
                        }
                    }
                }
            },
        },
        {
            $match: {
                $expr: {
                    $and: [
                        { $eq: ['$variation.stock', 'in'] },
                        { $gte: ['$variation.stockQuantity', quantity] }
                    ]
                }
            }
        },
        {
            $project: {
                productId: "$_id",
                _id: 0,
                shipping: 1,
                packaged: 1,
                supplierId: 1,
                storeTitle: 1,
                title: "$variation.title",
                brand: 1,
                sku: "$variation.sku",
                image: "$variation.image",
                amount: { $multiply: ["$variation.sellPrice", quantity] },
                savingAmount: { $multiply: [{ $subtract: ["$variation.stockPrice", "$variation.sellPrice"] }, quantity] },
                initialDiscount: "$variation.discount",
                attributes: "$variation.attributes",
                sellPrice: "$variation.sellPrice",
                stockPrice: "$variation.stockPrice",
                stockQuantity: "$variation.stockQuantity",
                stock: "$variation.stock"
            }
        },
        {
            $set: {
                quantity,
                itemId: Math.round(Math.random() * 9999999999)
            }
        }
    ];
};
// Shopping cart pipeline
module.exports.shopping_cart_pipe = (customerId, clientUri) => {
    let pipelines = [
        { $match: { customerId: mongoDB.ObjectId(customerId) } },
        {
            $lookup: {
                from: "PRODUCT_VARIATION_TBL",
                let: { mainProductId: "$productId", sku: "$sku" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$productId", "$$mainProductId"] },
                                    { $eq: ["$sku", "$$sku"] },
                                    { $eq: ["$stock", "in"] }
                                ]
                            }
                        }
                    },
                    { $project: { productId: 0, _id: 0 } }
                ],
                as: "variations"
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [{
                            $arrayElemAt: [{
                                    $ifNull: ["$variations", []]
                                }, 0]
                        }, "$$ROOT"]
                }
            }
        },
        { $unset: ["variations"] },
        { $match: { stock: 'in' } },
        {
            $lookup: {
                from: "SUPPLIER_TBL",
                localField: "supplierId",
                foreignField: "_id",
                as: "supplier"
            }
        }, {
            $addFields: {
                supplier: {
                    $ifNull: [
                        {
                            $arrayElemAt: [
                                "$supplier",
                                0
                            ]
                        }, {}
                    ]
                }
            }
        },
        {
            $project: {
                title: { $ifNull: ["$title", "$title"] },
                brand: 1,
                quantity: 1,
                productId: 1,
                supplierId: 1,
                storeTitle: "$supplier.storeInformation.companyName",
                sku: 1,
                imageLink: "$mainImage",
                customerId: 1,
                savingAmount: { $multiply: [{ $subtract: ["$stockPrice", "$sellPrice"] }, '$quantity'] },
                amount: { $multiply: ["$sellPrice", '$quantity'] },
                initialDiscount: "$discount",
                sellPrice: "$sellPrice",
                stockPrice: "$stockPrice",
                attributes: "$attributes",
                stockQuantity: "$stockQuantity",
                stock: "$stock",
                productType: 1,
                supplierEmail: {
                    $ifNull: ["$supplier.personalInformation.email", null]
                },
                link: 1
            }
        },
        {
            $set: {
                link: {
                    $concat: [clientUri, "/", "$link"]
                }
            }
        }
    ];
    return pipelines;
};
/**
 *
 */
module.exports.product_detail_review_pipe = (pid, sku) => {
    return [
        { $match: { _id: mongoDB.ObjectId(pid) } },
        {
            $addFields: {
                variation: {
                    $cond: {
                        if: { $eq: ["$productType", "single"] },
                        then: productTypeSingle,
                        else: {
                            $arrayElemAt: [
                                {
                                    $filter: {
                                        input: "$variations",
                                        as: "variant",
                                        cond: {
                                            $eq: ["$$variant.sku", sku]
                                        }
                                    }
                                },
                                0
                            ]
                        }
                    }
                }
            }
        }, {
            $project: basicProductProject
        }
    ];
};
