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
const productIntroModel = (body) => {
    return {
        title: (body === null || body === void 0 ? void 0 : body.title) || "",
        slug: (body === null || body === void 0 ? void 0 : body.slug) || "",
        save_as: 'draft',
        seller: (body === null || body === void 0 ? void 0 : body.seller) || {},
        rating: [
            { weight: 5, count: 0 },
            { weight: 4, count: 0 },
            { weight: 3, count: 0 },
            { weight: 2, count: 0 },
            { weight: 1, count: 0 },
        ],
        ratingAverage: 0,
        createdAt: new Date(Date.now()),
    };
};
const productImagesModel = (body) => {
    return {
        images: (body === null || body === void 0 ? void 0 : body.images) || [],
    };
};
module.exports = { productUpdateModel, productIntroModel, productImagesModel };
