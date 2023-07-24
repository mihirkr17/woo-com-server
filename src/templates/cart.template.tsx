module.exports.cartTemplate = (productID: String, listingID: String, sku: String) => {
   return {
      productID,
      sku,
      listingID,
      quantity: 1,
      addedAt: new Date()
   }
}