module.exports.cartTemplate = (email: String, productId: String, listingId: String, variationId: String) => {
   return {
      customerEmail: email,
      productId,
      variationId,
      listingId,
      quantity: 1,
      addedAt: new Date()
   }
}
