"use strict";
// ManageProduct.Controller.tsx
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
const { ObjectId } = require("mongodb");
const { product_listing_template_engine } = require("../../templates/product.template");
const Supplier = require("../../model/supplier.model");
const Product = require("../../model/product.model");
const { product_variation_template_engine } = require("../../templates/product.template");
const { generateListingID } = require("../../utils/generator");
const { Api400Error, Api500Error, Api403Error, Api404Error } = require("../../errors/apiResponse");
module.exports.allProductsBySupplier = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        const role = req.decoded.role;
        let { p_search, p_category, p_status } = req === null || req === void 0 ? void 0 : req.query;
        const user = yield Supplier.findOne({ $and: [{ email: authEmail }, { role }] });
        let item;
        let page;
        item = req.query.items;
        page = req.query.page;
        let products;
        let showFor = [];
        if (user.role === 'SUPPLIER') {
            showFor = [
                { "supplier.storeName": user === null || user === void 0 ? void 0 : user.storeName },
                { "supplier.email": user === null || user === void 0 ? void 0 : user.email }
            ];
        }
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
        products = yield Product.aggregate([
            {
                $match: {
                    $and: showFor,
                }
            },
            {
                $addFields: {
                    totalVariation: { $cond: { if: { $isArray: "$variations" }, then: { $size: "$variations" }, else: 0 } }
                }
            },
            {
                $match: filters
            },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    categories: 1,
                    variations: 1,
                    brand: 1,
                    _lid: 1,
                    status: 1,
                    supplier: 1,
                    createdAt: 1,
                    modifiedAt: 1,
                    isVerified: 1,
                    totalVariation: 1
                }
            },
            {
                $skip: page * parseInt(item)
            }, {
                $limit: (parseInt(item))
            }
        ]);
        const totalCount = yield Product.countDocuments({ $and: showFor });
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
module.exports.fetchSingleProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId } = req === null || req === void 0 ? void 0 : req.params;
        const data = yield Product.findOne({ _id: ObjectId(productId) });
        return res.status(200).send({ success: true, statusCode: 200, data });
    }
    catch (error) {
        next(error);
    }
});
module.exports.updateProductStatusController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const status = ["Active", "Draft"];
        const { productId, statusValue } = req === null || req === void 0 ? void 0 : req.body;
        if (!productId)
            throw new Api400Error("Required product id !");
        if (!ObjectId.isValid(productId))
            throw new Api400Error("Invalid product id !");
        if (!status.includes(statusValue))
            throw new Api400Error("Invalid status action !");
        yield Product.findOneAndUpdate({ _id: ObjectId(productId) }, { status: statusValue });
        return res.status(200).send({ success: true, statusCode: 200, message: `Status updated to "${statusValue}"` });
    }
    catch (error) {
        next(error);
    }
});
// Product listing
module.exports.productListingController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authEmail = req.decoded.email;
        const { formTypes } = req.params;
        const body = req.body;
        let model;
        const supplier = yield Supplier.findOne({ $and: [{ email: authEmail }, { role: 'SUPPLIER' }] });
        if (!supplier)
            throw new Api403Error("Forbidden !");
        if (formTypes === 'create') {
            if (!(body === null || body === void 0 ? void 0 : body.variation)) {
                throw new Api400Error("Required variation !");
            }
            model = product_listing_template_engine(body, { storeName: supplier === null || supplier === void 0 ? void 0 : supplier.storeName, storeId: supplier === null || supplier === void 0 ? void 0 : supplier._id });
            model["rating"] = [
                { weight: 5, count: 0 },
                { weight: 4, count: 0 },
                { weight: 3, count: 0 },
                { weight: 2, count: 0 },
                { weight: 1, count: 0 },
            ];
            model["ratingAverage"] = 0;
            model['status'] = 'Queue';
            model["createdAt"] = new Date();
            model["_lid"] = generateListingID();
            model["isVerified"] = false;
            let product = new Product(model);
            let results = yield product.save();
            if (results) {
                return res.status(200).send({
                    success: true,
                    statusCode: 200,
                    message: "Product created successfully. It will take upto 24 hours to on live.",
                });
            }
        }
    }
    catch (error) {
        next(error);
    }
});
// product variation controller
module.exports.productVariationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result;
        const { productId, variation, formType } = req.body;
        if (!ObjectId.isValid(productId))
            throw new Api400Error("Invalid product id !");
        let model = product_variation_template_engine(variation);
        // Update variation
        if (formType === 'update-variation') {
            result = yield Product.findOneAndUpdate({ _id: ObjectId(productId) }, { $set: { 'variations.$[i]': model } }, { arrayFilters: [{ "i.sku": variation === null || variation === void 0 ? void 0 : variation.sku }] });
        }
        // create new variation
        if (formType === 'new-variation') {
            result = yield Product.findOneAndUpdate({ _id: ObjectId(productId) }, { $push: { variations: model } }, { upsert: true });
        }
        if (result)
            return res.status(200).send({
                success: true,
                statusCode: 200,
                message: (formType === 'update-variation' ? "Variation successfully updated." : "Welcome new variation added.")
            });
        throw new Api500Error((formType === 'update-variation' ? "Variation update failed !" : "Can't added new variation !"));
    }
    catch (error) {
        next(error);
    }
});
module.exports.productDeleteController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId, storeName } = req.params;
        const { _id } = req === null || req === void 0 ? void 0 : req.decoded;
        if (!ObjectId.isValid(productId))
            throw new Api400Error("Invalid product id !");
        if (!ObjectId.isValid(_id))
            throw new Api400Error("Invalid supplier id !");
        //return --> "acknowledged" : true, "deletedCount" : 1
        const result = yield Product.deleteOne({
            $and: [
                { _id: ObjectId(productId) },
                { 'supplier.storeName': storeName },
                { 'supplier.storeId': ObjectId(_id) }
            ]
        });
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
// delete product variation controller
module.exports.productVariationDeleteController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId, productSku, storeName } = req.params;
        const { _id } = req === null || req === void 0 ? void 0 : req.decoded;
        const product = yield Product.findOne({
            $and: [
                { _id: ObjectId(productId) },
                { "supplier.storeId": ObjectId(_id) },
                { "supplier.storeName": storeName }
            ]
        });
        if (!product)
            throw new Api404Error("Sorry! Product not found!!!");
        // Validate that productSku corresponds to an actual variation
        const variationToDelete = product === null || product === void 0 ? void 0 : product.variations.find((variation) => (variation === null || variation === void 0 ? void 0 : variation.sku) === productSku);
        if (!variationToDelete)
            throw new Api404Error("Variation not found");
        if (Array.isArray(product === null || product === void 0 ? void 0 : product.variations) && (product === null || product === void 0 ? void 0 : product.variations.length) <= 1)
            throw new Api400Error("Please create another variation before delete this variation !");
        product.variations = product === null || product === void 0 ? void 0 : product.variations.filter((variation) => (variation === null || variation === void 0 ? void 0 : variation.sku) !== productSku);
        yield product.save();
        return res.status(200).send({ success: true, statusCode: 200, message: 'Variation deleted successfully.' });
    }
    catch (error) {
        next(error);
    }
});
module.exports.productUpdateController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const urlParams = req.params.paramsType;
        const { _id } = req === null || req === void 0 ? void 0 : req.decoded;
        let filters = {};
        const { productId, actionType, shipping, packageInfo, manufacturer, description } = req.body;
        if (!productId)
            throw new Api400Error("Required product ID !");
        if (!actionType)
            throw new Api400Error("Required actionType !");
        if (actionType === "SHIPPING-INFORMATION" && urlParams === "shipping-information") {
            if (!shipping)
                throw new Error("Required shipping information !");
            const { fulfilledBy, procurementType, procurementSLA, provider } = shipping && shipping;
            if (procurementType === "" || fulfilledBy === "" || procurementSLA === "" || provider === "")
                throw new Error("Required fulfilledBy, procurementType, procurementSLA");
            filters = {
                $set: { shipping: shipping }
            };
        }
        if (actionType === "PACKAGE-DIMENSION" && urlParams === "packaged-dimension") {
            if (!packageInfo)
                throw new Error("Required packaged information about product");
            const { packageWeight, packageLength, packageWidth, packageHeight, inTheBox } = packageInfo && packageInfo;
            let volumetricWeight = ((parseFloat(packageHeight) * parseFloat(packageLength) * parseFloat(packageWidth)) / 5000).toFixed(1);
            volumetricWeight = parseFloat(volumetricWeight);
            let newPackage = {
                dimension: {
                    height: parseFloat(packageHeight),
                    length: parseFloat(packageLength),
                    width: parseFloat(packageWidth)
                },
                weight: parseFloat(packageWeight),
                weightUnit: 'kg',
                dimensionUnit: 'cm',
                volumetricWeight,
                inTheBox: inTheBox
            };
            filters = {
                $set: { packaged: newPackage }
            };
        }
        if (actionType === "MANUFACTURER-INFORMATION" && urlParams === "manufacturer-information") {
            if (!manufacturer || typeof manufacturer !== "object")
                throw new Api400Error("Required manufacturer details about product !");
            const { manufacturerOrigin, manufacturerDetails } = manufacturer && manufacturer;
            filters = {
                $set: {
                    "manufacturer.origin": manufacturerOrigin,
                    "manufacturer.details": manufacturerDetails
                }
            };
        }
        if (actionType === "DESCRIPTION-INFORMATION" && urlParams === "description") {
            filters = {
                $set: {
                    description
                }
            };
        }
        const result = yield Product.findOneAndUpdate({ $and: [{ "supplier.storeId": ObjectId(_id) }, { _id: ObjectId(productId) }] }, filters, { upsert: true });
        if (!result)
            throw new Api500Error("Failed to updated!");
        return res.status(200).send({ success: true, statusCode: 200, message: urlParams + " updated successfully." });
    }
    catch (error) {
        next(error);
    }
});
module.exports.productStockUpdateController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { storeName } = req.params;
        const { productId, variation } = req === null || req === void 0 ? void 0 : req.body;
        if (!(variation === null || variation === void 0 ? void 0 : variation.sku) || !(variation === null || variation === void 0 ? void 0 : variation.available))
            throw new Api400Error("Product sku and unit required !");
        if (!ObjectId.isValid(productId))
            throw new Api400Error("Invalid product id !");
        let stock = (variation === null || variation === void 0 ? void 0 : variation.available) <= 1 ? "out" : "in";
        const result = yield Product.findOneAndUpdate({ $and: [{ _id: ObjectId(productId) }, { 'supplier.storeName': storeName }] }, {
            $set: {
                "variations.$[i].available": variation === null || variation === void 0 ? void 0 : variation.available,
                "variations.$[i].stock": stock,
            },
        }, {
            arrayFilters: [{ "i.sku": variation === null || variation === void 0 ? void 0 : variation.sku }]
        });
        if (!result) {
            throw new Api500Error("Failed to update stock quantity !!!");
        }
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Product stock updated successfully.",
        });
    }
    catch (error) {
        next(error);
    }
});
