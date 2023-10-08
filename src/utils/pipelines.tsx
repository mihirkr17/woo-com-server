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
      { $match: { $and: [{ _id: mongoDB.ObjectId(productID) }, { status: "Active" }] } },
      {
         $addFields: {
            swatch: {
               $map: {
                  input: "$variations",
                  as: "vars",
                  in: {
                     attributes: "$$vars.attributes",
                     sku: "$$vars.sku",
                     stock: "$$vars.stock"
                  }
               }
            },
            variation: {
               $ifNull: [
                  {
                     $arrayElemAt: [{
                        $filter: {
                           input: "$variations",
                           as: "vars",
                           cond: { $eq: ["$$vars.sku", sku] }
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
            from: 'suppliers',
            localField: 'supplierId',
            foreignField: '_id',
            as: 'store'
         }
      },
      { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$store", 0] }, "$$ROOT"] } } },
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
            supplierId: 1,
            storeName: 1,
            supplierPhone: "$phone",
            imageUrls: 1,
            rating: 1,
            ratingAverage: 1,
            ratingCount: {
               $reduce: {
                  input: "$rating",
                  initialValue: 0,
                  in: { $add: ["$$value", "$$this.count"] }
               }
            },
            metaDescription: 1,
            description: 1,
            manufacturer: 1,
            highlights: 1,
            pricing: "$variation.pricing",
            volumetricWeight: "$packaged.volumetricWeight",
            weight: "$packaged.weight",
            weightUnit: "$packaged.weightUnit"
         }
      }
   ]
}


module.exports.product_detail_relate_pipe = (sku: string, categories: any[]) => {
   return [
      { $match: { $and: [{ categories: { $in: categories } }, { status: "Active" }] } },
      {
         $addFields: {
            variations: {
               $ifNull: [{ $arrayElemAt: ["$variations", { $floor: { $multiply: [{ $rand: {} }, { $size: "$variations" }] } }] }, {}]
            }
         }
      },
      { $project: basicProductProject },
      { $limit: 10 },
   ]
}


module.exports.home_store_product_pipe = (totalLimit: number) => {
   return [
      { $match: { $and: [{ status: "Active" }, { isVerified: true }] } },
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
      { $match: { status: "Active" } },
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
            imageUrl: { $arrayElemAt: ["$imageUrls", 0] },
            slug: 1
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


module.exports.ctg_main_product_pipe = (filters: any, sorting: any) => {
   return [
      { $match: filters },
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
      { $project: basicProductProject },
      sorting
   ]
}


module.exports.single_purchase_pipe = (productId: string, sku: string, quantity: number) => {

   return [
      { $match: { $and: [{ _id: mongoDB.ObjectId(productId) }, { status: "Active" }] } },
      {
         $lookup: {
            from: 'suppliers',
            localField: "supplierId",
            foreignField: "_id",
            as: "supplier"
         }
      },
      { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$supplier", 0] }, "$$ROOT"] } } },
      { $unset: ["supplier"] },
      {
         $addFields: {
            variation: {
               $arrayElemAt: [{
                  $filter: {
                     input: "$variations",
                     cond: { $eq: ['$$variation.sku', sku] },
                     as: "variation"
                  }
               }, 0]
            }
         },
      },
      {
         $match: {
            $expr: {
               $and: [
                  { $eq: ['$variation.stock', 'in'] },
                  { $gte: ['$variation.available', quantity] }
               ]
            }
         }
      },
      {
         $project: {
            productId: "$_id",
            _id: 0,
            shipping: 1,
            packaged: 1,
            supplierId: 1,
            supplierEmail: "$email",
            storeName: 1,
            title: 1,
            brand: 1,
            sku: "$variation.sku",
            imageUrl: { $arrayElemAt: ["$imageUrls", 0] },
            sellingPrice: "$variation.pricing.sellingPrice",
            amount: { $multiply: ["$variation.pricing.sellingPrice", quantity] },
            savingAmount: { $multiply: [{ $subtract: ["$variation.pricing.price", "$variation.pricing.sellingPrice"] }, quantity] },
            price: "$variation.pricing.price",
            attributes: "$variation.attributes",
            available: "$variation.available",
            stock: "$variation.stock"
         }
      },
      {
         $set: {
            quantity,
            itemId: Math.round(Math.random() * 9999999999)
         }
      }
   ]
}


module.exports.shopping_cart_pipe = (customerId: string) => {
   return [
      { $match: { customerId: mongoDB.ObjectId(customerId) } },
      {
         $lookup: {
            from: 'products',
            localField: "productId",
            foreignField: "_id",
            as: "main_product"
         }
      },
      { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
      { $unset: ["main_product"] },
      {
         $lookup: {
            from: 'suppliers',
            localField: "supplierId",
            foreignField: "_id",
            as: "supplier"
         }
      },
      { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$supplier", 0] }, "$$ROOT"] } } },
      { $unset: ["supplier"] },
      {
         $addFields: {
            variation: {
               $arrayElemAt: [
                  {
                     $filter: {
                        input: '$variations',
                        as: 'variation',
                        cond: { $eq: ["$$variation.sku", "$sku"] },
                     },
                  },
                  0
               ],
            },
         },
      },
      { $match: { 'variation.stock': 'in' } },
      { $project: shoppingCartProject }
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