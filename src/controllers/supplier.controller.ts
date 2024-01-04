// src/controllers/supplier.controller.ts

import { NextFunction, Request, Response } from "express";
const {
  product_listing_template_engine,
  product_variation_template_engine,
} = require("../templates/product.template");

const {
  orderStatusUpdater,
  productStockUpdater,
} = require("../services/common.service");

const { Error400, Error500, Error403, Error404 } = require("../res/response");

const {
  updateStockService,
  updateMainProductService,
  findProductVariationByIdAndSupplierId,
  variationDeleteService,
  productDeleteService,
  variationUpdateService,
  variationCreateService,
  productListingCreateService,
  findProductByIdService,
  countProductsService,
  allProductsBySupplierService,
  topSoldProductService,
  findOrderBySupplierIdService,
  settingService,
} = require("../services/supplier.service");

async function supplierOverview(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { _id } = req.decoded;
    let topSoldProducts: any;

    topSoldProducts = await topSoldProductService(_id);

    return res.status(200).send({
      success: true,
      statusCode: 200,
      data: { topSoldProducts },
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 *[All Products Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function allProductsBySupplier(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { _id } = req.decoded as { _id: string };

    let { p_search, p_category, p_status } = req?.query;

    let item: any;
    let page: any;
    item = req.query.items || 6;
    page = req.query.page || 1;
    let products: any;

    page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;

    const queries: any = [];

    if (p_search) {
      queries.push({ title: { $regex: p_search, $options: "i" } });
    }

    if (p_status) {
      queries.push({ status: { $regex: p_status, $options: "i" } });
    }

    if (p_category) {
      queries.push({ categories: { categories: { $in: [p_category] } } });
    }

    let filters = {};

    if (queries.length >= 1) {
      filters = { $and: queries };
    }

    products = await allProductsBySupplierService(_id, {
      page,
      filters,
      item,
    });

    const totalCount = await countProductsService(_id);

    return res.status(200).send({
      success: true,
      statusCode: 200,
      data: { products, totalCount },
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 *[Fetch One Product Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function fetchSingleProductBySupplier(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req?.params;

    const data = await findProductByIdService(productId);

    return res.status(200).send({ success: true, statusCode: 200, data });
  } catch (error: any) {
    next(error);
  }
}

/**
 * [Product Listing Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function productListingBySupplier(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, _id } = req.decoded as { email: string; _id: string };

    const body = req.body;

    const model = product_listing_template_engine(body, _id);

    const result = await productListingCreateService(model);

    if (!result) throw new Error500("Internal server error !");

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message:
        "Product created successfully. It will take upto 24 hours to on live.",
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * [Product Listing Variation Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function productVariationListingBySupplier(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let result: any;

    const { _id: supplierId } = req?.decoded;
    const { id } = req?.params;
    const { requestFor: formType } = req?.query;
    const { productId } = req.body as {
      productId: string;
    };

    // Update variation
    if (formType === "update-variation") {
      result = await variationUpdateService({
        supplierId,
        _id: id,
        ...req?.body,
      });
    }

    // create new variation
    if (formType === "new-variation") {
      result = await variationCreateService({
        supplierId,
        productId,
        ...req?.body,
      });
    }

    if (result)
      return res.status(200).send({
        success: true,
        statusCode: 200,
        message:
          formType === "update-variation"
            ? "Variation successfully updated."
            : "Welcome new variation added.",
      });

    throw new Error500(
      formType === "update-variation"
        ? "Variation update failed !"
        : "Can't added new variation !"
    );
  } catch (error: any) {
    next(error);
  }
}

/**
 * [Product Delete Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function productDeleteBySupplier(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params as {
      productId: string;
    };
    const { _id } = req?.decoded;

    //return --> "acknowledged" : true, "deletedCount" : 1
    const result = await productDeleteService(_id, productId);

    if (!result.deletedCount) throw new Error500("Internal Server Error !");

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Product deleted successfully.",
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * [Product Variation Delete Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function productVariationDeleteBySupplier(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId, productSku } = req.params as {
      productId: string;
      productSku: string;
    };
    const { _id } = req?.decoded as { _id: string };

    const { variations } = await findProductVariationByIdAndSupplierId(
      _id,
      productId
    );

    if (!variations) throw new Error404("Sorry! Variation not found!!!");

    if (Array.isArray(variations) && variations.length <= 1)
      throw new Error400(
        "Please create another variation before delete this variation !"
      );

    // Validate that productSku corresponds to an actual variation
    const variationToDelete =
      Array.isArray(variations) &&
      variations.find((variation: any) => variation?.sku === productSku);

    if (!variationToDelete) throw new Error404("Variation not found");

    await variationDeleteService(_id, productId, productSku);

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Variation deleted successfully.",
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * [Product Update Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function productUpdateBySupplier(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { _id } = req?.decoded as { _id: string };

    const {
      productId,
      actionType,
      shipping,
      packageInfo,
      manufacturer,
      description,
      variation,
      status,
    } = req.body;

    if (!productId) throw new Error400("Required product ID !");

    if (!actionType) throw new Error400("Required actionType !");

    if (actionType === "SHIPPING-INFORMATION") {
      if (!shipping) throw new Error400("Required shipping information !");

      const { fulfilledBy, procurementType, procurementSLA, provider } =
        shipping && shipping;

      if (
        procurementType === "" ||
        fulfilledBy === "" ||
        procurementSLA === "" ||
        provider === ""
      )
        throw new Error400(
          "Required fulfilledBy, procurementType, procurementSLA"
        );

      const result = await updateMainProductService(_id, productId, {
        $set: { shipping: shipping },
      });

      return (
        result &&
        res.status(200).send({
          success: true,
          statusCode: 200,
          message: "Product shipping details updated successfully.",
        })
      );
    }

    if (actionType === "PACKAGE-DIMENSION") {
      if (!packageInfo)
        throw new Error("Required packaged information about product");

      const {
        packageWeight,
        packageLength,
        packageWidth,
        packageHeight,
        inTheBox,
      } = packageInfo && packageInfo;

      let volumetricWeight: any = (
        (parseFloat(packageHeight) *
          parseFloat(packageLength) *
          parseFloat(packageWidth)) /
        5000
      ).toFixed(1);
      volumetricWeight = parseFloat(volumetricWeight);

      let newPackage = {
        dimension: {
          height: parseFloat(packageHeight),
          length: parseFloat(packageLength),
          width: parseFloat(packageWidth),
        },
        weight: parseFloat(packageWeight),
        weightUnit: "kg",
        dimensionUnit: "cm",
        volumetricWeight,
        inTheBox: inTheBox,
      };

      const result = await updateMainProductService(_id, productId, {
        $set: { packaged: newPackage },
      });

      return (
        result &&
        res.status(200).send({
          success: true,
          statusCode: 200,
          message: "Product package dimension updated successfully.",
        })
      );
    }

    if (actionType === "MANUFACTURER-INFORMATION") {
      if (!manufacturer || typeof manufacturer !== "object")
        throw new Error400("Required manufacturer details about product !");

      const { manufacturerOrigin, manufacturerDetails } =
        manufacturer && manufacturer;

      const result = await updateMainProductService(_id, productId, {
        $set: {
          "manufacturer.origin": manufacturerOrigin,
          "manufacturer.details": manufacturerDetails,
        },
      });

      return (
        result &&
        res.status(200).send({
          success: true,
          statusCode: 200,
          message: "Product manufacturer details updated successfully.",
        })
      );
    }

    if (actionType === "DESCRIPTION-INFORMATION") {
      const result = await updateMainProductService(_id, productId, {
        $set: {
          description,
        },
      });

      return (
        result &&
        res.status(200).send({
          success: true,
          statusCode: 200,
          message: "Product description updated successfully.",
        })
      );
    }

    // update status
    if (actionType === "UPDATE-STATUS") {
      const statusValues = ["Active", "Draft"];

      if (!statusValues.includes(status) || !status)
        throw new Error400("Invalid status value!");

      const result = await updateMainProductService(_id, productId, {
        $set: { status },
      });

      return (
        result &&
        res.status(200).send({
          success: true,
          statusCode: 200,
          message: "Product status updated successfully.",
        })
      );
    }

    // update stock
    if (actionType === "UPDATE-STOCK") {
      if (!variation?.sku || !variation?.available)
        throw new Error400("Product sku and unit required !");

      let stock = variation?.available <= 1 ? "out" : "in";

      variation.stock = stock;

      const result = await updateStockService(_id, productId, variation);

      if (!result) {
        throw new Error500("Failed to update stock quantity !!!");
      }

      return res.status(200).send({
        success: true,
        statusCode: 200,
        message: "Product stock updated successfully.",
      });
    }
  } catch (error: any) {
    next(error);
  }
}

/**
 * [Manage Orders Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function manageOrderBySupplier(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { _id } = req?.decoded;
    const filters: any = req.query.filters;

    let { orders, orderCounter } = await findOrderBySupplierIdService(
      _id,
      filters
    );

    orderCounter = orderCounter[0];

    return res.status(200).send({
      success: true,
      statusCode: 200,
      data: {
        placeOrderCount: orderCounter?.placeOrderCount,
        dispatchOrderCount: orderCounter?.dispatchOrderCount,
        totalOrderCount: orderCounter?.totalOrderCount,
        orders,
      },
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * [ORDER_TABLE Status Management Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function orderStatusManagementBySupplier(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.body)
      throw new Error400("Required body information about orders !");

    const { type, customerEmail, orderID, cancelReason, sellerEmail, items } =
      req.body as {
        type: string;
        customerEmail: string;
        orderID: string;
        cancelReason: string;
        sellerEmail: string;
        items: any[];
      };

    if (!type || type === "") throw new Error400("Required status type !");

    if (!customerEmail) throw new Error400("Required customer email !");

    if (!orderID || orderID === "")
      throw new Error400("Required ORDER_TABLE ID !");

    const result = await orderStatusUpdater({
      type,
      customerEmail,
      orderID,
      cancelReason,
      sellerEmail,
      items,
    });

    if (result) {
      if (type === "canceled" && cancelReason && Array.isArray(items)) {
        await Promise.all(
          items.map(async (item) => await productStockUpdater("inc", item))
        );
      }

      return res.status(200).send({
        success: true,
        statusCode: 200,
        message: "ORDER_TABLE status updated to " + type,
      });
    }
  } catch (error: any) {
    next(error);
  }
}

/**
 * [async description]
 *
 * @param   {Request}       req   [req description]
 * @param   {Response}      res   [res description]
 * @param   {NextFunction}  next  [next description]
 *
 * @return  {[type]}              [return description]
 */
async function settingsSystem(req: Request, res: Response, next: NextFunction) {
  try {
    const { _id } = req?.decoded;
    const Store = await settingService(_id);

    if (!Store)
      return res
        .status(200)
        .json({ success: true, statusCode: 200, data: null });

    return res.status(200).send({
      success: true,
      statusCode: 200,
      data: {
        store: Store,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  supplierOverview,
  allProductsBySupplier,
  fetchSingleProductBySupplier,
  productListingBySupplier,
  productVariationListingBySupplier,
  productDeleteBySupplier,
  productVariationDeleteBySupplier,
  productUpdateBySupplier,
  manageOrderBySupplier,
  orderStatusManagementBySupplier,
  settingsSystem,
};
