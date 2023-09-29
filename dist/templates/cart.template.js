"use strict";
module.exports.cartTemplate = (productId, sku) => {
    return {
        productId,
        sku,
        quantity: 1,
        addedAt: new Date()
    };
};
