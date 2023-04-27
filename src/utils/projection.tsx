module.exports.actualSellingPriceProject = { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] }


module.exports.newPricingProject = {
   sellingPrice: { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] },
   price: "$pricing.price",
   discount: {
      $toInt: {
         $multiply: [
            {
               $divide: [
                  { $subtract: ["$pricing.price", { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] }] },
                  "$pricing.price"
               ]
            }, 100]
      }
   }
}


module.exports.basicProductProject = {
   title: "$variations.vTitle",
   slug: 1,
   brand: 1,
   categories: 1,
   packageInfo: 1,
   rating: 1,
   ratingAverage: 1,
   _lid: 1,
   reviews: 1,
   image: { $first: "$images" },
   _vrid: "$variations._vrid",
   stock: "$variations.stock",
   variant: "$variations.variant",
   shipping: 1,
   pricing: {
      sellingPrice: { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] },
      price: "$pricing.price",
      discount: { $toInt: { $multiply: [{ $divide: [{ $subtract: ["$pricing.price", { $add: ["$pricing.sellingPrice", "$variations.priceModifier"] }] }, "$pricing.price"] }, 100] } }
   }
}