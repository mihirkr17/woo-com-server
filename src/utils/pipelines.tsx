const mongoDB = require("mongodb");
const { basicProductProject, shoppingCartProject } = require("./projection");

module.exports.store_products_pipe = (page: any, Filter: any, sortList: any) => {

   page = parseInt(page);
   page = page === 1 ? 0 : page - 1;

   return [
      {
         $match: Filter
      },
      {
         $addFields: {
            variations: {
               $ifNull: [{ $arrayElemAt: ["$variations", 0] }, {}]
            }
         }
      },
      { $project: basicProductProject },
      sortList,
      { $skip: 1 * page },
      { $limit: 1 }
   ]
}

module.exports.product_detail_pipe = (productID: string, sku: string) => {
   return [
      { $match: { $and: [{ _id: mongoDB.ObjectId(productID) }, { status: "active" }] } },
      {
         $addFields: {
            swatch: {
               $map: {
                  input: "$variations",
                  as: "variation",
                  in: {
                     variant: "$$variation.variant",
                     sku: "$$variation.sku",
                     brandColor: "$$variation.brandColor",
                     images: {
                        $cond: {
                           if : {$ifNull: ["$$variation.images", false]},
                           then: "$$variation.images",
                           else: null
                        }
                     }
                  }
               }
            },
            variation: {
               $ifNull: [
                  {
                     $arrayElemAt: [{
                        $filter: {
                           input: "$variations",
                           as: "variation",
                           cond: { $eq: ["$$variation.sku", sku] }
                        }
                     }, 0]
                  },
                  {}
               ]
            }
         }
      },
      {
         $lookup: {
            from: 'users',
            localField: 'supplier.email',
            foreignField: 'email',
            as: 'user'
         }
      },
      { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$user", 0] }, "$$ROOT"] } } },
      {
         $project: {
            title: 1,
            slug: 1,
            swatch: 1,
            variation: 1,
            fulfilledBy: "$shipping.fulfilledBy",
            specification: 1,
            brand: 1,
            status: 1,
            score: 1,
            sales: 1,
            views: 1,
            categories: 1,
            supplier: {
               email: "$email",
               storeName: "$store.name",
               phones: "$store.phones"
            },
            imageUrls: {
               $cond: {
                  if: { $ifNull: ["$variation.images", false] },
                  then: "$variation.images",
                  else: "$imageUrls"
               }
            },
            rating: 1,
            ratingAverage: 1,
            ratingCount: {
               $reduce: {
                  input: "$rating",
                  initialValue: 0,
                  in: { $add: ["$$value", "$$this.count"] }
               }
            },
            createdAt: 1,
            keywords: 1,
            metaDescription: 1,
            description: 1,
            manufacturer: 1,
            highlights: 1,
            pricing: "$variation.pricing",
            isFreeShipping: "$shipping.isFree",
            volumetricWeight: "$packaged.volumetricWeight",
            weight: "$packaged.weight",
            weightUnit: "$packaged.weightUnit",
            _lid: 1
         }
      }
   ]
}



module.exports.product_detail_relate_pipe = (sku: string, categories: any[]) => {
   return [
      { $match: { $and: [{ categories: { $in: categories } }, { status: "active" }] } },
      {
         $addFields: {
            variations: {
               $arrayElemAt: ["$variations", 0]
            }
         }
      },
      { $project: basicProductProject },
      { $limit: 10 },
   ]
}


module.exports.home_store_product_pipe = (totalLimit: number) => {
   return [
      { $match: { status: "active" } },
      {
         $addFields: {
            variations: {
               $ifNull: [{ $arrayElemAt: ["$variations", { $floor: { $multiply: [{ $rand: {} }, { $size: "$variations" }] } }] }, {}]
            }
         }
      },
      { $project: basicProductProject },
      { $sort: { "variations.sku": -1 } },
      { $limit: totalLimit },
      { $sample: { size: totalLimit ?? 6 } }
   ]
}


module.exports.search_product_pipe = (q: any) => {
   return [
      { $match: { status: "active" } },
      { $unwind: { path: "$variations" } },
      {
         $match: {
            $or: [
               { title: { $regex: q, $options: "i" } },
               { brand: { $regex: q, $options: "i" } },
               { categories: { $in: [q] } },
            ],
         },
      },
      {
         $project: {
            title: 1,
            categories: 1,
            sku: "$variations.sku",
            assets: {
               $ifNull: [
                  { $arrayElemAt: ["$options", { $indexOfArray: ["$options.color", "$variations.brandColor"] }] },
                  null
               ]
            },
            slug: 1,
            _lid: 1
         },
      },
   ]
}


module.exports.ctg_filter_product_pipe = (category: any) => {
   return [
      {
         $match: { categories: { $all: category } }
      },
      {
         $addFields: {
            variations: {
               $arrayElemAt: [{
                  $filter: {
                     input: "$variations",
                     cond: { $eq: ["$$v.stock", "in"] },
                     as: "v"
                  }
               }, 0]
            },
         },
      },
      {
         $project: {
            _id: 0,
            brand: 1,
            variant: "$variations.variant"
         }
      }
   ]
}


module.exports.ctg_main_product_pipe = (category: any, filterByBrand: string, filterByPriceRange: any, sorting: any) => {
   return [
      { $match: { categories: { $all: category } } },
      {
         $addFields: {
            variations: {
               $arrayElemAt: [{
                  $filter: {
                     input: "$variations",
                     cond: { $eq: ["$$v.stock", "in"] },
                     as: "v"
                  }
               }, 0]
            },
         },
      },
      { $match: filterByBrand },
      { $project: basicProductProject },
      { $match: filterByPriceRange },
      sorting
   ]
}


module.exports.single_purchase_pipe = (productID: string, sku: string, quantity: number) => {

   return [
      { $match: { $and: [{ _id: mongoDB.ObjectId(productID) }, { status: "active" }] } },
      {
         $addFields: {
            variations: {
               $arrayElemAt: [{
                  $filter: {
                     input: "$variations",
                     cond: {
                        $and: [
                           { $eq: ['$$variation.sku', sku] },
                           { $eq: ['$$variation.stock', "in"] },
                           { $gte: ["$$variation.available", quantity] }
                        ]
                     },
                     as: "variation"
                  }
               }, 0]
            },
            quantity
         },
      },
      {
         $project: {
            _id: 0,
            title: 1,
            slug: 1,
            brand: 1,
            packaged: 1,
            assets: {
               $ifNull: [
                  { $arrayElemAt: ["$options", { $indexOfArray: ["$options.color", "$variations.brandColor"] }] },
                  null
               ]
            },
            sku: "$variations.sku",
            supplier: 1,
            shipping: 1,
            savingAmount: {
               $multiply: [{
                  $subtract: ["$variations.pricing.price", "$variations.pricing.sellingPrice"]
               }, quantity]
            },
            baseAmount: { $multiply: ["$variations.pricing.sellingPrice", quantity] },
            sellingPrice: "$variations.pricing.sellingPrice",
            paymentInfo: 1,
            variant: "$variations.variant",
            available: "$variations.available",
            stock: "$variations.stock",
            productID,
            quantity: 1
         }
      }, {
         $unset: ["variations"]
      }
   ]
}



module.exports.shopping_cart_pipe = (email: string) => {
   return [
      { $match: { customerEmail: email } },
      { $unwind: { path: "$items" } },
      {
         $lookup: {
            from: 'products',
            localField: "items.listingID",
            foreignField: "_lid",
            as: "main_product"
         }
      },
      { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
      { $project: { main_product: 0 } },
      {
         $addFields: {
            variations: {
               $ifNull: [
                  {
                     $arrayElemAt: [{
                        $filter: {
                           input: "$variations",
                           cond: {
                              $and: [
                                 { $eq: ['$$variation.sku', '$items.sku'] },
                                 { $eq: ['$$variation.stock', "in"] },
                                 { $eq: ["$status", "active"] }
                              ]
                           },
                           as: "variation"
                        }
                     }, 0]
                  },
                  {}
               ]
            }
         },
      },
      {
         $project: shoppingCartProject
      },
      {
         $unset: ["variations", "items"]
      }
   ]
}

module.exports.get_review_product_details_pipe = (pid: string, sku: string) => {
   return [
      { $match: { _id: mongoDB.ObjectId(pid) } },
      {
         $addFields: {
            variations: {
               $ifNull: [
                  {
                     $arrayElemAt: [
                        {
                           $filter: {
                              input: "$variations",
                              as: "variant",
                              cond: {
                                 $eq: ["$$variant.sku", sku]
                              }
                           }
                        },
                        0
                     ]
                  },
                  null
               ]
            }
         }
      }, {
         $project: basicProductProject
      }
   ]
}