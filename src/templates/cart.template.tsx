module.exports.cartTemplate = (email: String, productID: String, listingID: String, variationID: String) => {
   return {
      customerEmail: email,
      productID,
      variationID,
      listingID,
      quantity: 1,
      addedAt: new Date()
   }
}
