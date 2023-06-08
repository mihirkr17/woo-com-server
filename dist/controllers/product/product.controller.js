"use strict";
// product.controller.tsx
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
const Product = require("../../model/product.model");
const { findUserByEmail, updateProductInformation } = require("../../services/common.service");
const { calculateShippingCost, calculatePopularityScore } = require("../../utils/common");
const { product_detail_pipe, product_detail_relate_pipe, home_store_product_pipe, search_product_pipe, single_purchase_pipe, ctg_filter_product_pipe, ctg_main_product_pipe } = require("../../utils/pipelines");
const NodeCache = require("../../utils/NodeCache");
const PrivacyPolicy = require("../../model/privacyPolicy.model");
const { Api400Error } = require("../../errors/apiResponse");
const { validEmail } = require("../../utils/validator");
const User = require("../../model/user.model");
const { ObjectId } = require("mongodb");
const Review = require("../../model/reviews.model");
/**
 * @controller      --> Fetch the single product information in product details page.
 * @required        --> [req.headers.authorization:email, req.query:productID, req.query:variationID, req.params:product slug]
 * @request_method  --> GET
 */
module.exports.fetchProductDetails = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { pId: productID, vId: variationID, oTracker } = req.query;
        if (!productID || typeof productID !== "string")
            throw new Api400Error("Invalid product id ");
        if (!variationID || typeof variationID !== "string")
            throw new Api400Error("Invalid variation id ");
        let productDetail;
        // Product Details
        let cacheData = NodeCache.getCache(`${productID}_${variationID}`);
        if (cacheData) {
            productDetail = cacheData;
        }
        else {
            productDetail = yield Product.aggregate(product_detail_pipe(productID, variationID));
            productDetail = productDetail[0];
            if (oTracker) {
                productDetail["productID"] = productDetail === null || productDetail === void 0 ? void 0 : productDetail._id;
                yield updateProductInformation(productDetail, { actionType: "views" });
            }
            productDetail["policies"] = (_a = yield PrivacyPolicy.findOne({})) !== null && _a !== void 0 ? _a : {};
            NodeCache.saveCache(`${productID}_${variationID}`, productDetail);
        }
        // Related products
        const relatedProducts = yield Product.aggregate(product_detail_relate_pipe(variationID, productDetail === null || productDetail === void 0 ? void 0 : productDetail.categories));
        // all success
        return res.status(200).send({
            success: true,
            statusCode: 200,
            data: { product: productDetail !== null && productDetail !== void 0 ? productDetail : {}, relatedProducts: relatedProducts !== null && relatedProducts !== void 0 ? relatedProducts : [], }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @controller      --> productsByCategoryController
 * @required        --> categories [Optional -> filters query]
 */
module.exports.productsByCategoryController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categories } = req.query;
        const { brand, sorted, price_range } = req.body;
        let newBrand = brand && brand.split("~");
        let category = (categories && categories.toString().split(",")) || [];
        let sorting = {};
        if (sorted === "lowest") {
            sorting = { $sort: { "pricing.sellingPrice": 1 } };
        }
        else if (sorted === "highest") {
            sorting = { $sort: { "pricing.sellingPrice": -1 } };
        }
        else {
            sorting = { $sort: { "variations.modifiedAt": 1 } };
        }
        let filterByBrand = newBrand ? { brand: { $in: newBrand } } : {};
        let filterByPriceRange = price_range ? {
            "pricing.sellingPrice": { $lte: parseInt(price_range) }
        } : {};
        const filterData = (yield Product.aggregate(ctg_filter_product_pipe(category))) || [];
        const products = (yield Product.aggregate(ctg_main_product_pipe(category, filterByBrand, filterByPriceRange, sorting))) || [];
        return products ? res.status(200).send({ success: true, statusCode: 200, products, filterData })
            : res.status(404).send({
                success: false,
                statusCode: 404,
                message: "Products not available.",
            });
    }
    catch (error) {
        next(error);
    }
});
module.exports.searchProducts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = req.params.q;
        if (!q || q === "") {
            return res.status(200).send([]);
        }
        const result = (yield Product.aggregate(search_product_pipe(q))) || [];
        return result && res.status(200).send(result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * @controller      --> Home store controller.
 * @required        --> []
 * @request_method  --> GET
 */
module.exports.homeStoreController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalLimits = parseInt(req.params.limits);
        const products = yield Product.aggregate(home_store_product_pipe(totalLimits));
        return res.status(200).send({
            success: true, statusCode: 200, data: {
                store: products,
                topSellingProducts: null,
                topRatedProducts: null
            }
        });
    }
    catch (error) {
        next(error);
    }
});
module.exports.fetchTopSellingProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const seller = req.query.seller;
        let filterQuery = {
            status: "active",
        };
        if (seller) {
            filterQuery['SELLER'] = seller;
        }
        const result = yield Product.find(filterQuery).sort({ "stockInfo.sold": -1 }).limit(6).toArray();
        return res.status(200).send(result);
    }
    catch (error) {
        next(error);
    }
});
module.exports.purchaseProductController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e, _f;
    try {
        const authEmail = req.decoded.email;
        let user = yield findUserByEmail(authEmail);
        const { listingID, variationID, quantity, productID, customerEmail } = req === null || req === void 0 ? void 0 : req.body;
        let defaultShippingAddress = (Array.isArray((_b = user === null || user === void 0 ? void 0 : user.buyer) === null || _b === void 0 ? void 0 : _b.shippingAddress) &&
            ((_c = user === null || user === void 0 ? void 0 : user.buyer) === null || _c === void 0 ? void 0 : _c.shippingAddress.filter((adr) => (adr === null || adr === void 0 ? void 0 : adr.default_shipping_address) === true)[0]));
        let areaType = defaultShippingAddress === null || defaultShippingAddress === void 0 ? void 0 : defaultShippingAddress.area_type;
        let newQuantity = parseInt(quantity);
        let product = yield Product.aggregate(single_purchase_pipe(productID, listingID, variationID, newQuantity));
        if (product && typeof product !== 'undefined') {
            product = product[0];
            product["customerEmail"] = customerEmail;
            if (((_d = product === null || product === void 0 ? void 0 : product.shipping) === null || _d === void 0 ? void 0 : _d.isFree) && ((_e = product === null || product === void 0 ? void 0 : product.shipping) === null || _e === void 0 ? void 0 : _e.isFree)) {
                product["shippingCharge"] = 0;
            }
            else {
                product["shippingCharge"] = calculateShippingCost((((_f = product === null || product === void 0 ? void 0 : product.packaged) === null || _f === void 0 ? void 0 : _f.volumetricWeight) * (product === null || product === void 0 ? void 0 : product.quantity)), areaType);
            }
        }
        return res.status(200).send({
            success: true, statusCode: 200, data: {
                module: {
                    product,
                    container_p: {
                        baseAmounts: parseInt(product === null || product === void 0 ? void 0 : product.baseAmount),
                        totalQuantities: product === null || product === void 0 ? void 0 : product.quantity,
                        finalAmounts: (parseInt(product === null || product === void 0 ? void 0 : product.baseAmount) + (product === null || product === void 0 ? void 0 : product.shippingCharge)),
                        shippingFees: product === null || product === void 0 ? void 0 : product.shippingCharge,
                        savingAmounts: product === null || product === void 0 ? void 0 : product.savingAmount
                    },
                    numberOfProducts: product.length || 0
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
