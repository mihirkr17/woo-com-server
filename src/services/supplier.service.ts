const ProductTbl = require("../model/product.model");
const OrderTbl = require("../model/order.model");
const { ObjectId: mdbObjectId } = require("mongodb");

/**
 *
 * @param storeId
 * @param productId
 * @param variation
 * @returns
 */
async function updateStockService(
  storeId: string,
  productId: string,
  variation: any
) {
  try {
    return await ProductTbl.findOneAndUpdate(
      {
        $and: [
          { _id: mdbObjectId(productId) },
          { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @param productId
 * @param values
 * @returns
 */
async function updateMainProductService(
  storeId: string,
  productId: string,
  values: any
) {
  try {
    return await ProductTbl.findOneAndUpdate(
      {
        $and: [
          { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @param productId
 * @returns
 */
async function findProductVariationByIdAndSupplierId(
  storeId: string,
  productId: string
) {
  try {
    let product = await ProductTbl.aggregate([
      {
        $match: {
          $and: [
            { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @param productId
 * @param sku
 * @returns
 */
async function variationDeleteService(
  storeId: string,
  productId: string,
  sku: string
): Promise<any> {
  try {
    return await ProductTbl.findOneAndUpdate(
      {
        $and: [
          { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @param productId
 * @returns
 */
async function deleteProductService(storeId: string, productId: string) {
  try {
    return await ProductTbl.findOneAndDelete({
      $and: [
        { _id: mdbObjectId(productId) },
        { storeId: mdbObjectId(storeId) },
      ],
    });
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param storeId
 * @param productId
 * @param model
 * @param sku
 */
async function variationUpdateService(
  storeId: string,
  productId: string,
  model: any,
  sku: string
) {
  try {
    await ProductTbl.findOneAndUpdate(
      {
        $and: [
          { _id: mdbObjectId(productId) },
          { storeId: mdbObjectId(storeId) },
        ],
      },
      { $set: { "variations.$[i]": model } },
      { arrayFilters: [{ "i.sku": sku }] }
    );
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param storeId
 * @param productId
 * @param model
 * @returns
 */
async function variationCreateService(
  storeId: string,
  productId: string,
  model: any
) {
  try {
    return await ProductTbl.findOneAndUpdate(
      {
        $and: [
          { _id: mdbObjectId(productId) },
          { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @returns
 */
async function countProductsService(storeId: string) {
  try {
    return await ProductTbl.countDocuments({
      storeId: mdbObjectId(storeId),
    });
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param storeId
 * @param params
 * @returns
 */
async function allProductsBySupplierService(storeId: string, params: any) {
  const { page, filters, item } = params;
  try {
    return await ProductTbl.aggregate([
      { $match: { storeId: mdbObjectId(storeId) } },
      {
        $addFields: {
          totalVariation: {
            $cond: {
              if: { $isArray: "$variations" },
              then: { $size: "$variations" },
              else: 0,
            },
          },
        },
      },
      {
        $match: filters,
      },
      {
        $project: {
          title: 1,
          slug: 1,
          imageUrls: 1,
          categories: 1,
          variations: 1,
          brand: 1,
          _lid: 1,
          status: 1,
          supplier: 1,
          createdAt: 1,
          modifiedAt: 1,
          isVerified: 1,
          totalVariation: 1,
        },
      },
      { $sort: { _id: -1 } },
      {
        $skip: page * parseInt(item),
      },
      {
        $limit: parseInt(item),
      },
    ]);
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param storeId
 * @returns
 */
async function topSoldProductService(storeId: string) {
  try {
    return await ProductTbl.aggregate([
      {
        $match: { storeId: mdbObjectId(storeId) },
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
 * @param storeId
 * @returns
 */
async function findOrderBySupplierIdService(storeId: string) {
  try {
    const orders = await OrderTbl.aggregate([
      { $unwind: { path: "$items" } },
      { $match: { "items.storeId": mdbObjectId(storeId) } },
      { $sort: { _id: -1 } },
    ]);

    let orderCounter = await OrderTbl.aggregate([
      { $unwind: { path: "$items" } },
      { $match: { "items.storeId": mdbObjectId(storeId) } },
      {
        $group: {
          _id: "$items.storeId",
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
};
