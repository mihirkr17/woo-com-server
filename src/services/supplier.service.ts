const ProductTbl = require("../model/PRODUCT_TBL");
const VariationTbl = require("../model/PRODUCT_VARIATION_TBL");
const OrderTbl = require("../model/ORDER_TBL");
const StoreTbl = require("../model/SUPPLIER_TBL");
const { ObjectId: mdbObjectId } = require("mongodb");

/**
 *
 * @param supplierId
 * @param productId
 * @param variation
 * @returns
 */
async function updateStockService(
  supplierId: string,
  productId: string,
  variation: any
) {
  try {
    return await ProductTbl.findOneAndUpdate(
      {
        $and: [
          { _id: mdbObjectId(productId) },
          { supplierId: mdbObjectId(supplierId) },
        ],
      },
      {
        $set: {
          "variations.$[i].available": variation?.available,
          "variations.$[i].stock": variation?.stock,
        },
      },
      {
        arrayFilters: [{ "i.sku": variation?.sku }],
      }
    );
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param supplierId
 * @param productId
 * @param values
 * @returns
 */
async function updateMainProductService(
  supplierId: string,
  productId: string,
  values: any
) {
  try {
    return await ProductTbl.findOneAndUpdate(
      {
        $and: [
          { supplierId: mdbObjectId(supplierId) },
          { _id: mdbObjectId(productId) },
        ],
      },
      values,
      { upsert: true }
    );
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param supplierId
 * @param productId
 * @returns
 */
async function findProductVariationByIdAndSupplierId(
  supplierId: string,
  productId: string
) {
  try {
    let product = await ProductTbl.aggregate([
      {
        $match: {
          $and: [
            { supplierId: mdbObjectId(supplierId) },
            { _id: mdbObjectId(productId) },
          ],
        },
      },
      {
        $project: {
          variations: 1,
        },
      },
    ]);

    product = product[0];

    return product;
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param supplierId
 * @param productId
 * @param sku
 * @returns
 */
async function variationDeleteService(
  supplierId: string,
  productId: string,
  sku: string
): Promise<any> {
  try {
    return await ProductTbl.findOneAndUpdate(
      {
        $and: [
          { supplierId: mdbObjectId(supplierId) },
          { _id: mdbObjectId(productId) },
        ],
      },
      { $pull: { variations: { $elemMatch: { sku } } } }
    );
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param supplierId
 * @param productId
 * @returns
 */
async function deleteProductService(supplierId: string, productId: string) {
  try {
    return await ProductTbl.findOneAndDelete({
      $and: [
        { _id: mdbObjectId(productId) },
        { supplierId: mdbObjectId(supplierId) },
      ],
    });
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param supplierId
 * @param productId
 * @param model
 * @param sku
 */
async function variationUpdateService(body: any) {
  try {
    return await VariationTbl.updateOne(
      {
        $and: [
          { _id: mdbObjectId(body?._id) },
          { productId: mdbObjectId(body?.productId) },
          { supplierId: mdbObjectId(body?.supplierId) },
        ],
      },
      { ...body }
    );
  } catch (error: any) {
    throw new Error(`Error in variationUpdateService: ${error?.message}`);
  }
}

/**
 *
 * @param supplierId
 * @param productId
 * @param model
 * @returns
 */
async function variationCreateService(
  supplierId: string,
  productId: string,
  model: any
) {
  try {
    return await ProductTbl.findOneAndUpdate(
      {
        $and: [
          { _id: mdbObjectId(productId) },
          { supplierId: mdbObjectId(supplierId) },
        ],
      },
      { $push: { variations: model } },
      { upsert: true }
    );
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param model
 * @returns
 */
async function productListingCreateService(model: any) {
  try {
    return await ProductTbl.insertOne(model);
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param productId
 * @returns
 */
async function findProductByIdService(productId: string) {
  try {
    return await ProductTbl.findOne({ _id: mdbObjectId(productId) });
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param supplierId
 * @returns
 */
async function countProductsService(supplierId: string) {
  try {
    return await ProductTbl.countDocuments({
      supplierId: mdbObjectId(supplierId),
    });
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param supplierId
 * @param params
 * @returns
 */
async function allProductsBySupplierService(supplierId: string, params: any) {
  const { page, filters, item } = params;
  try {
    return await VariationTbl.find({ supplierId: mdbObjectId(supplierId) });
    // return await ProductTbl.aggregate([
    //   { $match: { supplierId: mdbObjectId(supplierId) } },
    //   {
    //     $lookup: {
    //       from: "PRODUCT_VARIATION_TBL",
    //       localField: "_id",
    //       foreignField: "productId",
    //       as: "variations",
    //     },
    //   },
    //   {
    //     $addFields: {
    //       totalVariation: {
    //         $cond: {
    //           if: { $isArray: "$variations" },
    //           then: { $size: "$variations" },
    //           else: 0,
    //         },
    //       }
    //     },
    //   },
    //   {
    //     $match: filters,
    //   },
    //   {
    //     $project: {
    //       title: 1,
    //       slug: 1,
    //       categoriesFlat: 1,
    //       variations: 1,
    //       brand: 1,
    //       status: 1,
    //       supplier: 1,
    //       createdAt: 1,
    //       modifiedAt: 1,
    //       isVerified: 1,
    //       totalVariation: 1,
    //     },
    //   },
    //   { $sort: { _id: -1 } },
    //   {
    //     $skip: page * parseInt(item),
    //   },
    //   {
    //     $limit: parseInt(item),
    //   },
    // ]);
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param supplierId
 * @returns
 */
async function topSoldProductService(supplierId: string) {
  try {
    return await ProductTbl.aggregate([
      {
        $match: { supplierId: mdbObjectId(supplierId) },
      },
      {
        $addFields: {
          variations: {
            $arrayElemAt: ["$variations", 0],
          },
        },
      },
      {
        $project: {
          totalSold: "$sold",
          images: "$variations.images",
          title: "$title",
          sku: "$variations.sku",
          brand: "$brand",
          categories: "$categories",
          pricing: "$variations.pricing",
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param supplierId
 * @returns
 */
async function findOrderBySupplierIdService(supplierId: string) {
  try {
    const orders = await OrderTbl.aggregate([
      { $unwind: { path: "$items" } },
      { $match: { "items.supplierId": mdbObjectId(supplierId) } },
      { $sort: { _id: -1 } },
    ]);

    let orderCounter = await OrderTbl.aggregate([
      { $unwind: { path: "$items" } },
      { $match: { "items.supplierId": mdbObjectId(supplierId) } },
      {
        $group: {
          _id: "$items.supplierId",
          placeOrderCount: {
            $sum: {
              $cond: {
                if: { $eq: ["$orderStatus", "placed"] },
                then: 1,
                else: 0,
              },
            },
          },
          dispatchOrderCount: {
            $sum: {
              $cond: {
                if: { $eq: ["$orderStatus", "dispatch"] },
                then: 1,
                else: 0,
              },
            },
          },
          totalOrderCount: {
            $count: {},
          },
        },
      },
    ]);

    return { orders, orderCounter };
  } catch (error) {
    throw error;
  }
}

async function settingService(userId: string) {
  try {
    return await StoreTbl.findOne({ userId: mdbObjectId(userId) });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  updateStockService,
  updateMainProductService,
  findProductVariationByIdAndSupplierId,
  variationDeleteService,
  variationUpdateService,
  variationCreateService,
  deleteProductService,
  productListingCreateService,
  findProductByIdService,
  countProductsService,
  allProductsBySupplierService,
  topSoldProductService,
  findOrderBySupplierIdService,
  settingService,
};
