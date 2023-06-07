module.exports.cartTemplate = (productID: String, listingID: String, variationID: String, variantID: string) => {
   return {
      productID,
      variationID,
      variantID,
      listingID,
      quantity: 1,
      addedAt: new Date()
   }
}
