"use strict";
module.exports.cartTemplate = (email, productID, listingID, variationID) => {
    return {
        customerEmail: email,
        productID,
        variationID,
        listingID,
        quantity: 1,
        addedAt: new Date()
    };
};
