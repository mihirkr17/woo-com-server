"use strict";
module.exports.cartTemplate = (product, email, productId) => {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
        customerEmail: email,
        productId: productId,
        title: product === null || product === void 0 ? void 0 : product.title,
        slug: product === null || product === void 0 ? void 0 : product.slug,
        brand: product === null || product === void 0 ? void 0 : product.brand,
        size: (_a = product === null || product === void 0 ? void 0 : product.attr) === null || _a === void 0 ? void 0 : _a.size,
        image: product.images && product.images[0],
        quantity: 1,
        price: parseFloat((_b = product === null || product === void 0 ? void 0 : product.pricing) === null || _b === void 0 ? void 0 : _b.sellingPrice),
        totalAmount: parseFloat((_c = product === null || product === void 0 ? void 0 : product.pricing) === null || _c === void 0 ? void 0 : _c.sellingPrice) * 1,
        discount: (_d = product === null || product === void 0 ? void 0 : product.pricing) === null || _d === void 0 ? void 0 : _d.discount,
        seller: (_e = product === null || product === void 0 ? void 0 : product.seller) === null || _e === void 0 ? void 0 : _e.name,
        sku: product === null || product === void 0 ? void 0 : product.sku,
        paymentInfo: (product === null || product === void 0 ? void 0 : product.paymentInfo) && (product === null || product === void 0 ? void 0 : product.paymentInfo),
        stock: (_f = product === null || product === void 0 ? void 0 : product.stockInfo) === null || _f === void 0 ? void 0 : _f.stock,
        available: (_g = product === null || product === void 0 ? void 0 : product.stockInfo) === null || _g === void 0 ? void 0 : _g.available,
        status: product === null || product === void 0 ? void 0 : product.status,
        addedAt: new Date()
    };
};
