module.exports.cartTemplate = (productID: String, listingID: String, variationID: String) => {
   return {
      productID,
      variationID,
      listingID,
      quantity: 1,
      addedAt: new Date()
   }
}
