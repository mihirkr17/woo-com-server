"use strict";
module.exports.cartTemplate = (productID, listingID, variationID) => {
    return {
        productID,
        variationID,
        listingID,
        quantity: 1,
        addedAt: new Date()
    };
};
