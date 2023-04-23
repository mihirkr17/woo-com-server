"use strict";
const product_listing_template_engine = (body, sellerData) => {
    let price = parseFloat(body === null || body === void 0 ? void 0 : body.price);
    let sellingPrice = parseFloat(body === null || body === void 0 ? void 0 : body.sellingPrice);
    let discount = ((price - sellingPrice) / price);
    discount = parseInt(discount) * 100;
    let volumetricWeight = ((parseFloat(body === null || body === void 0 ? void 0 : body.packageHeight) * parseFloat(body === null || body === void 0 ? void 0 : body.packageLength) * parseFloat(body === null || body === void 0 ? void 0 : body.packageWidth)) / 5000).toFixed(1);
    volumetricWeight = parseFloat(volumetricWeight);
    return {
        title: body === null || body === void 0 ? void 0 : body.title,
        slug: body === null || body === void 0 ? void 0 : body.slug,
        categories: [body === null || body === void 0 ? void 0 : body.category, body === null || body === void 0 ? void 0 : body.subCategory, body === null || body === void 0 ? void 0 : body.postCategory] || [],
        brand: body === null || body === void 0 ? void 0 : body.brand,
        images: body === null || body === void 0 ? void 0 : body.images,
        pricing: {
            price,
            sellingPrice,
            discount,
            currency: 'us'
        },
        sellerData,
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
            provider: body === null || body === void 0 ? void 0 : body.shippingProvider,
            isFree: body === null || body === void 0 ? void 0 : body.isFree
        },
        tax: {
            hsn: body === null || body === void 0 ? void 0 : body.taxHsn,
            code: body === null || body === void 0 ? void 0 : body.taxCode
        },
        manufacturer: {
            origin: body === null || body === void 0 ? void 0 : body.manufacturerOrigin,
            details: body === null || body === void 0 ? void 0 : body.manufacturerDetails,
        },
        warranty: body === null || body === void 0 ? void 0 : body.warranty,
        bodyInfo: (body === null || body === void 0 ? void 0 : body.bodyInfo) || {},
        specification: (body === null || body === void 0 ? void 0 : body.specification) || {},
        description: (body === null || body === void 0 ? void 0 : body.description) || ""
    };
};
const product_variation_template_engine = (body) => {
    let available = parseInt(body === null || body === void 0 ? void 0 : body.available) || 0;
    let priceModifier = parseInt(body === null || body === void 0 ? void 0 : body.priceModifier) || 0;
    let stock;
    if (available && available >= 1) {
        stock = "in";
    }
    else {
        stock = "out";
    }
    return {
        vTitle: body === null || body === void 0 ? void 0 : body.vTitle,
        sku: body === null || body === void 0 ? void 0 : body.sku,
        variant: (body === null || body === void 0 ? void 0 : body.variant) || {},
        attrs: (body === null || body === void 0 ? void 0 : body.attrs) || {},
        highlights: (body === null || body === void 0 ? void 0 : body.highlight) || [],
        priceModifier,
        stock,
        available: parseInt(body === null || body === void 0 ? void 0 : body.available),
        status: body === null || body === void 0 ? void 0 : body.status
    };
};
module.exports = { product_listing_template_engine, product_variation_template_engine };
