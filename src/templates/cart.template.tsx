module.exports.cartTemplate = (product: any, email: String, productId: String, listingId: String, variationId: String) => {
   return {
      customerEmail: email,
      productId,
      variationId,
      listingId,
      quantity: 1,
      addedAt: new Date()
      // title: product?.variations?.title,
      // slug: product?.variations?.slug,
      // brand: product?.brand,
      // size: product?.variations?.attributes?.size,
      // image: product?.variations?.images && product?.variations?.images[0],

      // price: parseFloat(product?.variations?.pricing?.sellingPrice),
      // totalAmount: parseFloat(product?.variations?.pricing?.sellingPrice) * 1,
      // discount: product?.variations?.pricing?.discount,
      // seller: product?.seller?.name,
      // sku: product?.variations?.sku,
      // paymentInfo: product?.paymentInfo && product?.paymentInfo,
      // stock: product?.variations?.stock,
      // available: product?.variations?.available,
      // status: product?.variations?.status,

   }
}
