
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
   slug: 1,
   imageUrl: { $arrayElemAt: ["$imageUrls", 0] },
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
   sku: "$variations.sku",
   stock: "$variations.stock",
   attributes: "$variations.attributes",
   shipping: 1,
   pricing: "$variations.pricing"
}

module.exports.shoppingCartProject = {
   title: 1,
   slug: 1,
   brand: 1,
   isShippingFree: "$shipping.isFree",
   packaged: 1,
   shipping: 1,
   quantity: 1,
   productId: 1,
   storeId: 1,
   storeTitle: "$storeTitle",
   sku: 1,
   imageUrl: { $arrayElemAt: ["$imageUrls", 0] },
   customerId: 1,
   savingAmount: { $multiply: [{ $subtract: ["$variation.pricing.price", "$variation.pricing.sellingPrice"] }, '$quantity'] },
   amount: { $multiply: ["$variation.pricing.sellingPrice", '$quantity'] },
   initialDiscount: "$variation.pricing.discount",
   sellingPrice: "$variation.pricing.sellingPrice",
   price: "$variation.pricing.price",
   attributes: "$variation.attributes",
   available: "$variation.available",
   stock: "$variation.stock"
}