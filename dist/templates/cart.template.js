"use strict";
module.exports.cartTemplate = (email, productId, listingId, variationId) => {
    return {
        customerEmail: email,
        productId,
        variationId,
        listingId,
        quantity: 1,
        addedAt: new Date()
    };
};
