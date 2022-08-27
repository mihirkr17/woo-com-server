"use strict";
const productModel = (body) => {
    let stock;
    let available = (body === null || body === void 0 ? void 0 : body.available) || 0;
    if (available && available >= 1) {
        stock = "in";
    }
    else {
        stock = "out";
    }
    return {
        title: (body === null || body === void 0 ? void 0 : body.title) || "",
        slug: (body === null || body === void 0 ? void 0 : body.slug) || "",
        brand: (body === null || body === void 0 ? void 0 : body.brand) || "",
        image: (body === null || body === void 0 ? void 0 : body.images) || [],
        info: {
            description: (body === null || body === void 0 ? void 0 : body.description) || "",
            short_description: (body === null || body === void 0 ? void 0 : body.short_description) || "",
            specification: (body === null || body === void 0 ? void 0 : body.specification) || "",
            size: (body === null || body === void 0 ? void 0 : body.size) || [],
        },
        pricing: (body === null || body === void 0 ? void 0 : body.pricing) || {},
        available: parseInt((body === null || body === void 0 ? void 0 : body.available) || 0),
        stock,
        package_dimension: {
            weight: parseFloat((body === null || body === void 0 ? void 0 : body.packageWeight) || 0),
            length: parseFloat((body === null || body === void 0 ? void 0 : body.packageLength) || 0),
            width: parseFloat((body === null || body === void 0 ? void 0 : body.packageWidth) || 0),
            height: parseFloat((body === null || body === void 0 ? void 0 : body.packageHeight) || 0),
        },
        delivery_service: {
            in_box: (body === null || body === void 0 ? void 0 : body.inBox) || "",
            warrantyType: (body === null || body === void 0 ? void 0 : body.warrantyType) || "",
            warrantyTime: (body === null || body === void 0 ? void 0 : body.warrantyTime) || "",
        },
        payment_option: (body === null || body === void 0 ? void 0 : body.payment_option) || [],
        sku: (body === null || body === void 0 ? void 0 : body.sku) || "",
        status: (body === null || body === void 0 ? void 0 : body.status) || "",
        save_as: "fulfilled",
        genre: {
            category: (body === null || body === void 0 ? void 0 : body.category) || "",
            sub_category: (body === null || body === void 0 ? void 0 : body.subCategory) || "",
            post_category: (body === null || body === void 0 ? void 0 : body.postCategory) || "", // third category
        },
        seller: (body === null || body === void 0 ? void 0 : body.seller) || "unknown",
        rating: [
            { weight: 5, count: 0 },
            { weight: 4, count: 0 },
            { weight: 3, count: 0 },
            { weight: 2, count: 0 },
            { weight: 1, count: 0 },
        ],
        rating_average: 0,
        createAt: new Date(Date.now()),
    };
};
const productUpdateModel = (body) => {
    let stock;
    let available = (body === null || body === void 0 ? void 0 : body.available) || 0;
    if (available && available >= 1) {
        stock = "in";
    }
    else {
        stock = "out";
    }
    return {
        title: (body === null || body === void 0 ? void 0 : body.title) || "",
        slug: (body === null || body === void 0 ? void 0 : body.slug) || "",
        image: (body === null || body === void 0 ? void 0 : body.images) || [],
        info: {
            description: (body === null || body === void 0 ? void 0 : body.description) || "",
            short_description: (body === null || body === void 0 ? void 0 : body.short_description) || "",
            specification: (body === null || body === void 0 ? void 0 : body.specification) || "",
            size: (body === null || body === void 0 ? void 0 : body.size) || [],
        },
        pricing: (body === null || body === void 0 ? void 0 : body.pricing) || {},
        available,
        stock,
        package_dimension: {
            weight: parseFloat((body === null || body === void 0 ? void 0 : body.packageWeight) || 0),
            length: parseFloat((body === null || body === void 0 ? void 0 : body.packageLength) || 0),
            width: parseFloat((body === null || body === void 0 ? void 0 : body.packageWidth) || 0),
            height: parseFloat((body === null || body === void 0 ? void 0 : body.packageHeight) || 0),
        },
        delivery_service: {
            in_box: (body === null || body === void 0 ? void 0 : body.inBox) || "",
            warrantyType: (body === null || body === void 0 ? void 0 : body.warrantyType) || "",
            warrantyTime: (body === null || body === void 0 ? void 0 : body.warrantyTime) || "",
        },
        payment_option: (body === null || body === void 0 ? void 0 : body.payment_option) || [],
        sku: (body === null || body === void 0 ? void 0 : body.sku) || "",
        status: (body === null || body === void 0 ? void 0 : body.status) || "",
        save_as: "fulfilled",
        modifiedAt: new Date(Date.now()),
    };
};
module.exports = { productModel, productUpdateModel };
