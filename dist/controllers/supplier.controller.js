"use strict";
// src/controllers/supplier.controller.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { product_listing_template_engine, product_variation_template_engine, } = require("../templates/product.template");
const { orderStatusUpdater, productStockUpdater, } = require("../services/common.service");
const { Api400Error, Api500Error, Api403Error, Api404Error, } = require("../errors/apiResponse");
const { updateStockService, updateMainProductService, findProductVariationByIdAndSupplierId, variationDeleteService, productDeleteService, variationUpdateService, variationCreateService, productListingCreateService, findProductByIdService, countProductsService, allProductsBySupplierService, topSoldProductService, findOrderBySupplierIdService, } = require("../services/supplier.service");
function supplierOverview(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req.decoded;
            let topSoldProducts;
            topSoldProducts = yield topSoldProductService(_id);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                data: { topSoldProducts },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *[All Products Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
function allProductsBySupplier(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req.decoded;
            let { p_search, p_category, p_status } = req === null || req === void 0 ? void 0 : req.query;
            let item;
            let page;
            item = req.query.items || 6;
            page = req.query.page || 1;
            let products;
            page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;
            const queries = [];
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
            products = yield allProductsBySupplierService(_id, {
                page,
                filters,
                item,
            });
            const totalCount = yield countProductsService(_id);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                data: { products, totalCount },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 *[Fetch One Product Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
function fetchSingleProductBySupplier(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { productId } = req === null || req === void 0 ? void 0 : req.params;
            const data = yield findProductByIdService(productId);
            return res.status(200).send({ success: true, statusCode: 200, data });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 * [Product Listing Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
function productListingBySupplier(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, _id } = req.decoded;
            const body = req.body;
            const model = product_listing_template_engine(body, _id);
            const result = yield productListingCreateService(model);
            if (!result)
                throw new Api500Error("Internal server error !");
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Product created successfully. It will take upto 24 hours to on live.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 * [Product Listing Variation Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
function productVariationListingBySupplier(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result;
            const { _id } = req === null || req === void 0 ? void 0 : req.decoded;
            const { productId, variation, formType } = req.body;
            const model = product_variation_template_engine(variation);
            // Update variation
            if (formType === "update-variation") {
                result = yield variationUpdateService(_id, productId, model, variation === null || variation === void 0 ? void 0 : variation.sku);
            }
            // create new variation
            if (formType === "new-variation") {
                result = yield variationCreateService(_id, productId, model);
            }
            if (result)
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: formType === "update-variation"
                        ? "Variation successfully updated."
                        : "Welcome new variation added.",
                });
            throw new Api500Error(formType === "update-variation"
                ? "Variation update failed !"
                : "Can't added new variation !");
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 * [Product Delete Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
function productDeleteBySupplier(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { productId } = req.params;
            const { _id } = req === null || req === void 0 ? void 0 : req.decoded;
            //return --> "acknowledged" : true, "deletedCount" : 1
            const result = yield productDeleteService(_id, productId);
            if (!result.deletedCount)
                throw new Api500Error("Internal Server Error !");
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Product deleted successfully.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 * [Product Variation Delete Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
function productVariationDeleteBySupplier(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { productId, productSku } = req.params;
            const { _id } = req === null || req === void 0 ? void 0 : req.decoded;
            const { variations } = yield findProductVariationByIdAndSupplierId(_id, productId);
            if (!variations)
                throw new Api404Error("Sorry! Variation not found!!!");
            if (Array.isArray(variations) && variations.length <= 1)
                throw new Api400Error("Please create another variation before delete this variation !");
            // Validate that productSku corresponds to an actual variation
            const variationToDelete = Array.isArray(variations) &&
                variations.find((variation) => (variation === null || variation === void 0 ? void 0 : variation.sku) === productSku);
            if (!variationToDelete)
                throw new Api404Error("Variation not found");
            yield variationDeleteService(_id, productId, productSku);
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: "Variation deleted successfully.",
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 * [Product Update Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
function productUpdateBySupplier(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req === null || req === void 0 ? void 0 : req.decoded;
            const { productId, actionType, shipping, packageInfo, manufacturer, description, variation, status, } = req.body;
            if (!productId)
                throw new Api400Error("Required product ID !");
            if (!actionType)
                throw new Api400Error("Required actionType !");
            if (actionType === "SHIPPING-INFORMATION") {
                if (!shipping)
                    throw new Api400Error("Required shipping information !");
                const { fulfilledBy, procurementType, procurementSLA, provider } = shipping && shipping;
                if (procurementType === "" ||
                    fulfilledBy === "" ||
                    procurementSLA === "" ||
                    provider === "")
                    throw new Api400Error("Required fulfilledBy, procurementType, procurementSLA");
                const result = yield updateMainProductService(_id, productId, {
                    $set: { shipping: shipping },
                });
                return (result &&
                    res.status(200).send({
                        success: true,
                        statusCode: 200,
                        message: "Product shipping details updated successfully.",
                    }));
            }
            if (actionType === "PACKAGE-DIMENSION") {
                if (!packageInfo)
                    throw new Error("Required packaged information about product");
                const { packageWeight, packageLength, packageWidth, packageHeight, inTheBox, } = packageInfo && packageInfo;
                let volumetricWeight = ((parseFloat(packageHeight) *
                    parseFloat(packageLength) *
                    parseFloat(packageWidth)) /
                    5000).toFixed(1);
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
                const result = yield updateMainProductService(_id, productId, {
                    $set: { packaged: newPackage },
                });
                return (result &&
                    res.status(200).send({
                        success: true,
                        statusCode: 200,
                        message: "Product package dimension updated successfully.",
                    }));
            }
            if (actionType === "MANUFACTURER-INFORMATION") {
                if (!manufacturer || typeof manufacturer !== "object")
                    throw new Api400Error("Required manufacturer details about product !");
                const { manufacturerOrigin, manufacturerDetails } = manufacturer && manufacturer;
                const result = yield updateMainProductService(_id, productId, {
                    $set: {
                        "manufacturer.origin": manufacturerOrigin,
                        "manufacturer.details": manufacturerDetails,
                    },
                });
                return (result &&
                    res.status(200).send({
                        success: true,
                        statusCode: 200,
                        message: "Product manufacturer details updated successfully.",
                    }));
            }
            if (actionType === "DESCRIPTION-INFORMATION") {
                const result = yield updateMainProductService(_id, productId, {
                    $set: {
                        description,
                    },
                });
                return (result &&
                    res.status(200).send({
                        success: true,
                        statusCode: 200,
                        message: "Product description updated successfully.",
                    }));
            }
            // update status
            if (actionType === "UPDATE-STATUS") {
                const statusValues = ["Active", "Draft"];
                if (!statusValues.includes(status) || !status)
                    throw new Api400Error("Invalid status value!");
                const result = yield updateMainProductService(_id, productId, {
                    $set: { status },
                });
                return (result &&
                    res.status(200).send({
                        success: true,
                        statusCode: 200,
                        message: "Product status updated successfully.",
                    }));
            }
            // update stock
            if (actionType === "UPDATE-STOCK") {
                if (!(variation === null || variation === void 0 ? void 0 : variation.sku) || !(variation === null || variation === void 0 ? void 0 : variation.available))
                    throw new Api400Error("Product sku and unit required !");
                let stock = (variation === null || variation === void 0 ? void 0 : variation.available) <= 1 ? "out" : "in";
                variation.stock = stock;
                const result = yield updateStockService(_id, productId, variation);
                if (!result) {
                    throw new Api500Error("Failed to update stock quantity !!!");
                }
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "Product stock updated successfully.",
                });
            }
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 * [Manage Orders Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
function manageOrderBySupplier(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = req === null || req === void 0 ? void 0 : req.decoded;
            const filters = req.query.filters;
            let { orders, orderCounter } = yield findOrderBySupplierIdService(_id, filters);
            orderCounter = orderCounter[0];
            return res.status(200).send({
                success: true,
                statusCode: 200,
                data: {
                    placeOrderCount: orderCounter === null || orderCounter === void 0 ? void 0 : orderCounter.placeOrderCount,
                    dispatchOrderCount: orderCounter === null || orderCounter === void 0 ? void 0 : orderCounter.dispatchOrderCount,
                    totalOrderCount: orderCounter === null || orderCounter === void 0 ? void 0 : orderCounter.totalOrderCount,
                    orders,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
/**
 * [Order Status Management Controller]
 * @param req
 * @param res
 * @param next
 * @returns
 */
function orderStatusManagementBySupplier(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!req.body)
                throw new Api400Error("Required body information about orders !");
            const { type, customerEmail, orderID, cancelReason, sellerEmail, items } = req.body;
            if (!type || type === "")
                throw new Api400Error("Required status type !");
            if (!customerEmail)
                throw new Api400Error("Required customer email !");
            if (!orderID || orderID === "")
                throw new Api400Error("Required Order ID !");
            const result = yield orderStatusUpdater({
                type,
                customerEmail,
                orderID,
                cancelReason,
                sellerEmail,
                items,
            });
            if (result) {
                if (type === "canceled" && cancelReason && Array.isArray(items)) {
                    yield Promise.all(items.map((item) => __awaiter(this, void 0, void 0, function* () { return yield productStockUpdater("inc", item); })));
                }
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "Order status updated to " + type,
                });
            }
        }
        catch (error) {
            next(error);
        }
    });
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
};
