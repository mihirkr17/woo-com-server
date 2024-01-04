
const discount = {
   $toInt: {
      $multiply: [
         {
            $divide: [
               {
                  $subtract: ["$pricing.price", {
                     $add:
                        ["$pricing.sellingPrice", "$variations.priceModifier"]
                  }]
               }, "$pricing.price"]
         }, 100]
   }
}

module.exports.basicProductProject = {
   title: 1,
   variations: 1,
   slug: 1,
   image: 1,
   brand: 1,
   score: 1,
   sales: 1,
   views: 1,
   categories: 1,
   rating: 1,
   ratingAverage: 1,
   ratingCount: {
      $reduce: {
         input: "$rating",
         initialValue: 0,
         in: { $add: ["$$value", "$$this.count"] }
      }
   },
   sku: "$sku",
   stock: "$stock",
   attributes: "$attributes",
   shipping: 1,
   stockPrice: "$stockPrice",
   sellPrice: "$sellPrice"
}

module.exports.shoppingCartProject = {
   title: { $ifNull: ["$variation.title", "$title"] },
   slug: 1,
   brand: 1,
   isShippingFree: "$shipping.isFree",
   packaged: 1,
   shipping: 1,
   quantity: 1,
   productId: 1,
   supplierId: 1,
   storeTitle: 1,
   sku: 1,
   customerId: 1,
   savingAmount: { $multiply: [{ $subtract: ["$variation.stockPrice", "$variation.sellPrice"] }, '$quantity'] },
   image: "$variation.image",
   amount: { $multiply: ["$variation.sellPrice", '$quantity'] },
   initialDiscount: "$variation.discount",
   sellPrice: "$variation.sellPrice",
   stockPrice: "$variation.stockPrice",
   attributes: "$variation.attributes",
   stockQuantity: "$variation.stockQuantity",
   stock: "$variation.stock",
   productType: 1,
}
