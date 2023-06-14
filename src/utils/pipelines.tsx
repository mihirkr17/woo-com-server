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

module.exports.product_detail_pipe = (productID: string, variationID: string) => {
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
                     _vrid: "$$variation._vrid"
                  }
               }
            },
            variations: {
               $ifNull: [
                  {
                     $arrayElemAt: [{
                        $filter: {
                           input: "$variations",
                           as: "variation",
                           cond: { $eq: ["$$variation._vrid", variationID] }
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
            localField: 'supplier.id',
            foreignField: '_uuid',
            as: 'user'
         }
      },
      { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$user", 0] }, "$$ROOT"] } } },
      {
         $project: {
            title: "$variations.vTitle",
            slug: 1,
            variations: 1,
            swatch: 1,
            store: 1,
            fulfilledBy: "$shipping.fulfilledBy",
            specification: 1,
            brand: 1,
            status: 1,
            score: 1,
            sales: 1,
            views: 1,
            categories: 1,
            supplier: 1,
            options: 1,
            assets:
            {
               $ifNull: [
                  { $arrayElemAt: ["$options", { $indexOfArray: ["$options.color", "$variations.variant.color"] }] },
                  null
               ]
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
            save_as: 1,
            createdAt: 1,
            keywords: 1,
            meta_description: 1,
            description: 1,
            manufacturer: 1,
            highlights: 1,
            pricing: "$variations.pricing",
            isFreeShipping: "$shipping.isFree",
            volumetricWeight: "$packaged.volumetricWeight",
            weight: "$packaged.weight",
            weightUnit: "$packaged.weightUnit",
            _lid: 1
         }
      },
      {
         $set: { "supplier.contact_numbers": "$store.phones", store: 0 }
      }
   ]
}



module.exports.product_detail_relate_pipe = (variationID: string, categories: any[]) => {
   return [
      { $match: { $and: [{ categories: { $in: categories } }, { status: "active" }] } },
      {
         $addFields: {
            variations: {
               $arrayElemAt: [{
                  $filter: {
                     input: "$variations",
                     as: "variation",
                     cond: { $ne: ["$$variation._vrid", variationID] }
                  }
               }, 0]
            }
         }
      },
      { $project: basicProductProject },
      { $limit: 10 },
   ]
}


module.exports.home_store_product_pipe = (totalLimit: number) => {
   return [
      { $match: { $and: [{ save_as: 'fulfilled' }, { status: "active" }] } },
      {
         $addFields: {
            variations: {
               $ifNull: [{ $arrayElemAt: ["$variations", { $floor: { $multiply: [{ $rand: {} }, { $size: "$variations" }] } }] }, {}]
            }
         }
      },
      { $project: basicProductProject },
      { $sort: { "variations._vrid": -1 } },
      { $limit: totalLimit },
      { $sample: { size: totalLimit ?? 6 } }
   ]
}


module.exports.search_product_pipe = (q: any) => {
   return [
      { $match: { $and: [{ save_as: "fulfilled" }, { status: "active" }] } },
      { $unwind: { path: "$variations" } },
      {
         $match: {
            $or: [
               { title: { $regex: q, $options: "i" } },
               { "supplier.store_name": { $regex: q, $options: "i" } },
               { brand: { $regex: q, $options: "i" } },
               { categories: { $in: [q] } },
            ],
         },
      },
      {
         $project: {
            title: "$variations.vTitle",
            categories: 1,
            _vrid: "$variations._vrid",
            assets: {
               $ifNull: [
                  { $arrayElemAt: ["$options", { $indexOfArray: ["$options.color", "$variations.variant.color"] }] },
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


module.exports.single_purchase_pipe = (productID: string, listingID: string, variationID: string, quantity: number) => {

   return [
      { $match: { $and: [{ _lid: listingID }, { status: "active" }] } },
      {
         $addFields: {
            variations: {
               $arrayElemAt: [{
                  $filter: {
                     input: "$variations",
                     cond: {
                        $and: [
                           { $eq: ['$$variation._vrid', variationID] },
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
            title: "$variations.vTitle",
            slug: 1,
            brand: 1,
            packaged: 1,
            assets: {
               $ifNull: [
                  { $arrayElemAt: ["$options", { $indexOfArray: ["$options.color", "$variations.variant.color"] }] },
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
            listingID,
            variationID,
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
                                 { $eq: ['$$variation._vrid', '$items.variationID'] },
                                 { $eq: ['$$variation.stock', "in"] },
                                 { $eq: ["$status", "active"] },
                                 { $eq: ["$save_as", "fulfilled"] }
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

module.exports.get_review_product_details_pipe = (pid: string, vid: string) => {
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
                                 $eq: ["$$variant._vrid", vid]
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