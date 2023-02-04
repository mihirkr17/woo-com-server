"use strict";
const productIntroTemplate = (body) => {
    return {
        title: body === null || body === void 0 ? void 0 : body.title,
        slug: body === null || body === void 0 ? void 0 : body.slug,
        categories: [body === null || body === void 0 ? void 0 : body.category, body === null || body === void 0 ? void 0 : body.subCategory, body === null || body === void 0 ? void 0 : body.postCategory] || [],
        brand: body === null || body === void 0 ? void 0 : body.brand,
        shipping: {
            fulfilledBy: body === null || body === void 0 ? void 0 : body.fulfilledBy,
            procurementType: body === null || body === void 0 ? void 0 : body.procurementType,
            procurementSLA: body === null || body === void 0 ? void 0 : body.procurementSLA,
            provider: body === null || body === void 0 ? void 0 : body.shippingProvider,
            delivery: {
                localCharge: parseInt(body === null || body === void 0 ? void 0 : body.localCharge),
                zonalCharge: parseInt(body === null || body === void 0 ? void 0 : body.zonalCharge),
            },
            package: {
                dimension: {
                    height: body === null || body === void 0 ? void 0 : body.packageHeight,
                    length: body === null || body === void 0 ? void 0 : body.packageLength,
                    width: body === null || body === void 0 ? void 0 : body.packageWidth
                },
                weight: body === null || body === void 0 ? void 0 : body.packageWeight,
                weightUnit: 'kg',
                dimensionUnit: 'cm',
                inTheBox: body === null || body === void 0 ? void 0 : body.inTheBox
            }
        },
        tax: {
            hsn: body === null || body === void 0 ? void 0 : body.taxHsn,
            code: body === null || body === void 0 ? void 0 : body.taxCode
        },
        manufacturer: {
            origin: body === null || body === void 0 ? void 0 : body.manufacturerOrigin,
            details: body === null || body === void 0 ? void 0 : body.manufacturerDetails,
        },
        paymentInfo: (body === null || body === void 0 ? void 0 : body.paymentInformation) || [],
        warranty: body === null || body === void 0 ? void 0 : body.warranty,
        bodyInfo: (body === null || body === void 0 ? void 0 : body.bodyInfo) || {},
        specification: (body === null || body === void 0 ? void 0 : body.specification) || {}
    };
};
const productVariation = (body) => {
    let available = parseInt(body === null || body === void 0 ? void 0 : body.available);
    let stock;
    if (available && available >= 1) {
        stock = "in";
    }
    else {
        stock = "out";
    }
    return {
        images: body === null || body === void 0 ? void 0 : body.images,
        sku: body === null || body === void 0 ? void 0 : body.sku,
        pricing: {
            price: parseFloat(body === null || body === void 0 ? void 0 : body.price),
            sellingPrice: parseFloat(body === null || body === void 0 ? void 0 : body.sellingPrice),
            discount: body === null || body === void 0 ? void 0 : body.discount,
            currency: 'BDT'
        },
        variant: (body === null || body === void 0 ? void 0 : body.variant) || {},
        stock,
        available: parseInt(body === null || body === void 0 ? void 0 : body.available),
        status: body === null || body === void 0 ? void 0 : body.status
    };
};
module.exports = { productIntroTemplate, productVariation };
