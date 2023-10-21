"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, isSupplier } = require("../middlewares/auth.middleware");
const { variationMDL, listingMDL, } = require("../middlewares/product.middleware");
const { supplierOverview, allProductsBySupplier, fetchSingleProductBySupplier, productListingBySupplier, productVariationListingBySupplier, productDeleteBySupplier, productVariationDeleteBySupplier, productUpdateBySupplier, manageOrderBySupplier, orderStatusManagementBySupplier, } = require("../controllers/supplier.controller");
router.get("/", verifyJWT, isSupplier, supplierOverview);
router.get("/view-products", verifyJWT, isSupplier, allProductsBySupplier);
router.get("/fetch-one-product/:productId", verifyJWT, isSupplier, fetchSingleProductBySupplier);
router.post("/product/new-listing", verifyJWT, isSupplier, listingMDL, productListingBySupplier);
router.post("/product/update-product/:paramsType", verifyJWT, isSupplier, productUpdateBySupplier);
// Put routes
router.put("/product/product-variation", verifyJWT, isSupplier, variationMDL, productVariationListingBySupplier);
// delete controller
router.delete("/product/delete-product-variation/:productId/:productSku", verifyJWT, isSupplier, productVariationDeleteBySupplier);
router.delete("/product/delete-product/:productId", verifyJWT, isSupplier, productDeleteBySupplier);
router.post("/order/status-management", verifyJWT, isSupplier, orderStatusManagementBySupplier);
router.get("/manage-orders", verifyJWT, isSupplier, manageOrderBySupplier);
module.exports = router;
