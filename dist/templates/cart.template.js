"use strict";
module.exports.cartTemplate = (productID, listingID, variationID, variantID) => {
    return {
        productID,
        variationID,
        variantID,
        listingID,
        quantity: 1,
        addedAt: new Date()
    };
};
