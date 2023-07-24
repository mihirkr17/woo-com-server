"use strict";
const { stockStatus, calculateDiscount } = require("../utils/common");
function product_variation_template_engine(body) {
    var _a, _b;
    let available = parseInt(body === null || body === void 0 ? void 0 : body.available) || 0;
    let price = parseInt((_a = body === null || body === void 0 ? void 0 : body.pricing) === null || _a === void 0 ? void 0 : _a.price);
    let sellingPrice = parseInt((_b = body === null || body === void 0 ? void 0 : body.pricing) === null || _b === void 0 ? void 0 : _b.sellingPrice);
    return {
        sku: body === null || body === void 0 ? void 0 : body.sku,
        variant: (body === null || body === void 0 ? void 0 : body.variant) || {},
        brandColor: body === null || body === void 0 ? void 0 : body.brandColor,
        attrs: (body === null || body === void 0 ? void 0 : body.attrs) || {},
        images: body === null || body === void 0 ? void 0 : body.images,
        pricing: {
            price,
            sellingPrice,
            discount: calculateDiscount({ price, sellingPrice })
        },
        stock: stockStatus(available),
        available,
    };
}
const product_listing_template_engine = (body, supplier) => {
    let volumetricWeight = ((parseFloat(body === null || body === void 0 ? void 0 : body.packageHeight) * parseFloat(body === null || body === void 0 ? void 0 : body.packageLength) * parseFloat(body === null || body === void 0 ? void 0 : body.packageWidth)) / 5000).toFixed(1);
    volumetricWeight = parseFloat(volumetricWeight);
    return {
        title: body === null || body === void 0 ? void 0 : body.title,
        slug: body === null || body === void 0 ? void 0 : body.slug,
        categories: [body === null || body === void 0 ? void 0 : body.category, body === null || body === void 0 ? void 0 : body.subCategory, body === null || body === void 0 ? void 0 : body.postCategory] || [],
        brand: body === null || body === void 0 ? void 0 : body.brand,
        highlights: (body === null || body === void 0 ? void 0 : body.highlights) || [],
        supplier,
        packaged: {
            dimension: {
                height: parseFloat(body === null || body === void 0 ? void 0 : body.packageHeight),
                length: parseFloat(body === null || body === void 0 ? void 0 : body.packageLength),
                width: parseFloat(body === null || body === void 0 ? void 0 : body.packageWidth)
            },
            weight: parseFloat(body === null || body === void 0 ? void 0 : body.packageWeight),
            weightUnit: 'kg',
            dimensionUnit: 'cm',
            volumetricWeight,
            inTheBox: body === null || body === void 0 ? void 0 : body.inTheBox
        },
        shipping: {
            fulfilledBy: body === null || body === void 0 ? void 0 : body.fulfilledBy,
            procurementType: body === null || body === void 0 ? void 0 : body.procurementType,
            procurementSLA: body === null || body === void 0 ? void 0 : body.procurementSLA,
            isFree: body === null || body === void 0 ? void 0 : body.isFree
        },
        variations: [product_variation_template_engine(body === null || body === void 0 ? void 0 : body.variation)],
        manufacturer: {
            origin: body === null || body === void 0 ? void 0 : body.manufacturerOrigin,
            details: body === null || body === void 0 ? void 0 : body.manufacturerDetails,
        },
        warranty: body === null || body === void 0 ? void 0 : body.warranty,
        keywords: body === null || body === void 0 ? void 0 : body.keywords,
        metaDescription: body === null || body === void 0 ? void 0 : body.metaDescription,
        specification: (body === null || body === void 0 ? void 0 : body.specification) || {},
        description: (body === null || body === void 0 ? void 0 : body.description) || ""
    };
};
module.exports = { product_listing_template_engine, product_variation_template_engine };
