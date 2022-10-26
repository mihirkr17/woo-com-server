"use strict";
const productUpdateModel = (body) => {
    let stock;
    let available = parseInt(body === null || body === void 0 ? void 0 : body.available) || 0;
    if (available && available >= 1) {
        stock = "in";
    }
    else {
        stock = "out";
    }
    return {
        attr: {
            size: (body === null || body === void 0 ? void 0 : body.size) || [],
            color: (body === null || body === void 0 ? void 0 : body.color) || [],
            material: (body === null || body === void 0 ? void 0 : body.material) || []
        },
        brand: (body === null || body === void 0 ? void 0 : body.brand) || '',
        bodyInfo: {
            description: (body === null || body === void 0 ? void 0 : body.description) || "",
            metaDescription: (body === null || body === void 0 ? void 0 : body.metaDescription) || "",
            specification: (body === null || body === void 0 ? void 0 : body.specification) || [],
        },
        pricing: {
            price: parseFloat(body === null || body === void 0 ? void 0 : body.price),
            sellingPrice: parseFloat(body.sellingPrice),
            discount: parseInt(body === null || body === void 0 ? void 0 : body.discount),
            currency: "BDT"
        },
        stockInfo: {
            stock,
            available
        },
        categories: [body === null || body === void 0 ? void 0 : body.category, body === null || body === void 0 ? void 0 : body.subCategory, body === null || body === void 0 ? void 0 : body.postCategory] || [],
        packageInfo: {
            inTheBox: (body === null || body === void 0 ? void 0 : body.inTheBox) || "",
            dimension: {
                weight: parseFloat((body === null || body === void 0 ? void 0 : body.packageWeight) || 0),
                length: parseFloat((body === null || body === void 0 ? void 0 : body.packageLength) || 0),
                width: parseFloat((body === null || body === void 0 ? void 0 : body.packageWidth) || 0),
                height: parseFloat((body === null || body === void 0 ? void 0 : body.packageHeight) || 0),
            },
            unit: 'cm'
        },
        variations: body === null || body === void 0 ? void 0 : body.variations,
        warranty: {
            wType: body === null || body === void 0 ? void 0 : body.warrantyType,
            wTime: body === null || body === void 0 ? void 0 : body.warrantyTime,
        },
        paymentInfo: (body === null || body === void 0 ? void 0 : body.paymentInfo) || [],
        sku: (body === null || body === void 0 ? void 0 : body.sku) || "",
        status: (body === null || body === void 0 ? void 0 : body.status) || "",
        modifiedAt: new Date(Date.now()),
    };
};
const productIntroTemplate = (body) => {
    return {
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
            localDeliveryCharge: body === null || body === void 0 ? void 0 : body.localDeliveryCharge,
            zonalDeliveryCharge: body === null || body === void 0 ? void 0 : body.zonalDeliveryCharge,
            nationalDeliveryCharge: body === null || body === void 0 ? void 0 : body.nationalDeliveryCharge
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
const productRatingTemplate = () => {
    return {
        rating: [
            { weight: 5, count: 0 },
            { weight: 4, count: 0 },
            { weight: 3, count: 0 },
            { weight: 2, count: 0 },
            { weight: 1, count: 0 },
        ],
        ratingAverage: 0,
    };
};
const productImagesModel = (body) => {
    return {
        images: (body === null || body === void 0 ? void 0 : body.images) || [],
    };
};
const variationOneTemplate = (body) => {
    let available = parseInt(body === null || body === void 0 ? void 0 : body.available);
    let stock;
    if (available && available >= 1) {
        stock = "in";
    }
    else {
        stock = "out";
    }
    return {
        title: body === null || body === void 0 ? void 0 : body.title,
        slug: body === null || body === void 0 ? void 0 : body.slug,
        images: body === null || body === void 0 ? void 0 : body.images,
        sku: body === null || body === void 0 ? void 0 : body.sku,
        pricing: {
            price: parseFloat(body === null || body === void 0 ? void 0 : body.price),
            sellingPrice: parseFloat(body === null || body === void 0 ? void 0 : body.sellingPrice),
            discount: body === null || body === void 0 ? void 0 : body.discount,
            currency: 'BDT'
        },
        stock,
        available: parseInt(body === null || body === void 0 ? void 0 : body.available),
        status: body === null || body === void 0 ? void 0 : body.status,
        modifiedAt: new Date(Date.now())
    };
};
module.exports = { productUpdateModel, productIntroTemplate, productImagesModel, variationOneTemplate, productRatingTemplate };
