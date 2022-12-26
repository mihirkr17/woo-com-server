"use strict";
const productIntroTemplate = (body) => {
    return {
        title: body === null || body === void 0 ? void 0 : body.title,
        slug: body === null || body === void 0 ? void 0 : body.slug,
        save_as: 'draft',
        categories: [body === null || body === void 0 ? void 0 : body.category, body === null || body === void 0 ? void 0 : body.subCategory, body === null || body === void 0 ? void 0 : body.postCategory] || [],
        brand: body === null || body === void 0 ? void 0 : body.brand,
        inventoryDetails: {
            fulfillmentBy: body === null || body === void 0 ? void 0 : body.fulfillmentBy,
            procurementType: body === null || body === void 0 ? void 0 : body.procurementType,
            procurementSLA: body === null || body === void 0 ? void 0 : body.procurementSLA
        },
        deliveryDetails: {
            shippingProvider: body === null || body === void 0 ? void 0 : body.shippingProvider,
            localDeliveryCharge: parseInt(body === null || body === void 0 ? void 0 : body.localDeliveryCharge),
            zonalDeliveryCharge: parseInt(body === null || body === void 0 ? void 0 : body.zonalDeliveryCharge),
            nationalDeliveryCharge: parseInt(body === null || body === void 0 ? void 0 : body.nationalDeliveryCharge)
        },
        packageInfo: {
            dimension: {
                height: body === null || body === void 0 ? void 0 : body.packageHeight,
                length: body === null || body === void 0 ? void 0 : body.packageLength,
                width: body === null || body === void 0 ? void 0 : body.packageWidth
            },
            weight: body === null || body === void 0 ? void 0 : body.packageWeight,
            weightUnit: 'kg',
            dimensionUnit: 'cm',
            inTheBox: body === null || body === void 0 ? void 0 : body.inTheBox
        },
        taxDetails: {
            hsn: body === null || body === void 0 ? void 0 : body.hsn,
            taxCode: body === null || body === void 0 ? void 0 : body.taxCode
        },
        manufacturer: {
            countryOfOrigin: body === null || body === void 0 ? void 0 : body.countryOfOrigin,
            manufacturerDetails: body === null || body === void 0 ? void 0 : body.manufacturerDetails,
            packerDetails: body === null || body === void 0 ? void 0 : body.packerDetails
        },
        paymentInfo: body === null || body === void 0 ? void 0 : body.paymentInfo,
        warranty: body === null || body === void 0 ? void 0 : body.warranty
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
        status: body === null || body === void 0 ? void 0 : body.status,
        modifiedAt: new Date(Date.now())
    };
};
module.exports = { productIntroTemplate, productVariation };
