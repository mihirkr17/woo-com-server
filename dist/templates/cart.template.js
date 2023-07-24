"use strict";
module.exports.cartTemplate = (productID, listingID, sku) => {
    return {
        productID,
        sku,
        listingID,
        quantity: 1,
        addedAt: new Date()
    };
};
