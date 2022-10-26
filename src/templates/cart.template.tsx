module.exports.cartTemplate = (product: any, email: String, productId: String) => {
   return {
      customerEmail: email,
      productId: productId,
      title: product?.title,
      slug: product?.slug,
      brand: product?.brand,
      size: product?.attr?.size,
      image: product.images && product.images[0],
      quantity: 1,
      price: parseFloat(product?.pricing?.sellingPrice),
      totalAmount: parseFloat(product?.pricing?.sellingPrice) * 1,
      discount: product?.pricing?.discount,
      seller: product?.seller?.name,
      sku: product?.sku,
      paymentInfo: product?.paymentInfo && product?.paymentInfo,
      stock: product?.stockInfo?.stock,
      available: product?.stockInfo?.available,
      status: product?.status,
      addedAt: new Date()
   }
}
