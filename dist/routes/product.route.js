"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, checkingSeller } = require("../middleware/auth");
const { variationOne } = require("../middleware/product.middleware");
const { homeStoreController, searchProducts, topRatedProducts, topSellingProducts, countProductsController, deleteProductController, updateProductController, updateStockController, addProductHandler, allProducts, fetchSingleProductController, fetchSingleProductByPidController, productsByCategoryController, fetchTopSellingProduct, manageProductController, setProductIntroController, dashboardOverviewController, productVariationController, deleteProductVariationController } = require("../controllers/product/product.controller");
try {
    /**
     * @apiRoutes /api/product
     */
    router.get("/search-products/:q", searchProducts);
    router.get("/product-count", countProductsController);
    router.delete("/delete-product", verifyJWT, checkingSeller, deleteProductController);
    router.put("/update-stock", verifyJWT, checkingSeller, updateStockController);
    router.post("/set-product-intro/:formTypes", verifyJWT, setProductIntroController);
    router.put("/set-product-details", verifyJWT, updateProductController);
    router.get("/fetch-single-product/:product_slug", fetchSingleProductController);
    router.get("/store/:limits", homeStoreController);
    /**
     * @requestMethod GET
     * @controller fetchSingleProductByPidController
     * @desc --> Fetch Single Product By Product ID
     * @required [pid -> query, ]
     */
    router.get("/fetch-single-product-by-pid", fetchSingleProductByPidController);
    /**
      * @requestMethod GET
      * @controller productsByCategoryController
      * @required categories [Optional -> filters query]
      */
    router.get("/product-by-category", productsByCategoryController);
    router.get("/fetch-top-selling-product", fetchTopSellingProduct);
    router.get("/manage-product", verifyJWT, manageProductController);
    router.get("/dashboard-overview", verifyJWT, dashboardOverviewController);
    router.put("/set-product-variation", verifyJWT, variationOne, productVariationController);
    router.delete("/delete-product-variation/:productId/:vId", verifyJWT, deleteProductVariationController);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
