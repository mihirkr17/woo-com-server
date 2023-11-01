"use strict";
const { stockStatus, calculateDiscount, calculateVolumetricWeight } = require("../utils/common");
function product_variation_template_engine({ available, pricing, attributes, sku }) {
    let price = parseInt(pricing === null || pricing === void 0 ? void 0 : pricing.price);
    let sellingPrice = parseInt(pricing === null || pricing === void 0 ? void 0 : pricing.sellingPrice);
    return {
        sku,
        attributes: attributes || {},
        pricing: {
            price,
            sellingPrice,
            discount: calculateDiscount({ price, sellingPrice })
        },
        stock: stockStatus(available),
        available,
    };
}
const product_listing_template_engine = (body, storeId) => {
    const packageHeight = parseFloat(body === null || body === void 0 ? void 0 : body.packageHeight);
    const packageLength = parseFloat(body === null || body === void 0 ? void 0 : body.packageLength);
    const packageWidth = parseFloat(body === null || body === void 0 ? void 0 : body.packageWidth);
    const packageWeight = parseFloat(body === null || body === void 0 ? void 0 : body.packageWeight);
    return {
        title: body === null || body === void 0 ? void 0 : body.title,
        slug: body === null || body === void 0 ? void 0 : body.slug,
        imageUrls: (body === null || body === void 0 ? void 0 : body.images) || [],
        categories: (body === null || body === void 0 ? void 0 : body.categories.split("/")) || [],
        brand: (body === null || body === void 0 ? void 0 : body.brand) || "No Brand",
        highlights: (body === null || body === void 0 ? void 0 : body.highlights) || [],
        storeId,
        packaged: {
            dimension: {
                height: packageHeight,
                length: packageLength,
                width: packageWidth
            },
            weight: packageWeight,
            weightUnit: 'kg',
            dimensionUnit: 'cm',
            volumetricWeight: calculateVolumetricWeight(packageHeight, packageLength, packageWidth),
            inTheBox: body === null || body === void 0 ? void 0 : body.inTheBox
        },
        shipping: {
            fulfilledBy: body === null || body === void 0 ? void 0 : body.fulfilledBy,
            procurementSLA: body === null || body === void 0 ? void 0 : body.procurementSLA,
            isFree: body === null || body === void 0 ? void 0 : body.isFree
        },
        variations: [product_variation_template_engine({
                attributes: body === null || body === void 0 ? void 0 : body.attributes,
                sku: body === null || body === void 0 ? void 0 : body.sku,
                available: parseInt(body === null || body === void 0 ? void 0 : body.available),
                pricing: body === null || body === void 0 ? void 0 : body.pricing
            })],
        manufacturer: {
            origin: body === null || body === void 0 ? void 0 : body.manufacturerOrigin,
            details: body === null || body === void 0 ? void 0 : body.manufacturerDetails,
        },
        warranty: body === null || body === void 0 ? void 0 : body.warranty,
        keywords: body === null || body === void 0 ? void 0 : body.keywords,
        metaDescription: body === null || body === void 0 ? void 0 : body.metaDescription,
        specification: (body === null || body === void 0 ? void 0 : body.specification) || {},
        description: (body === null || body === void 0 ? void 0 : body.description) || "",
        rating: [
            { weight: 5, count: 0 },
            { weight: 4, count: 0 },
            { weight: 3, count: 0 },
            { weight: 2, count: 0 },
            { weight: 1, count: 0 },
        ],
        ratingAverage: 0,
        isVerified: false,
        createdAt: new Date()
    };
};
module.exports = { product_listing_template_engine, product_variation_template_engine };
