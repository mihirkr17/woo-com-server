"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, checkingSeller } = require("../middleware/auth");
const { searchProducts, topRatedProducts, topSellingProducts, countProducts, deleteProducts, updateProduct, updateStock, addProductHandler, allProducts, fetchSingleProduct, fetchSingleProductByPid, productByCategory, fetchTopSellingProduct, manageProduct } = require("../controllers/product/product.controller");
try {
    router.get("/search-products/:q", searchProducts);
    router.get("/top_rated", topRatedProducts);
    router.get("/top_sell", topSellingProducts);
    router.get("/product-count", countProducts);
    router.delete("/delete-product/:productId", verifyJWT, deleteProducts);
    router.put("/update-product/:productId", verifyJWT, updateProduct);
    router.put("/update-stock", verifyJWT, checkingSeller, updateStock);
    router.post("/add-product", verifyJWT, addProductHandler);
    router.get("/all-products/:limits", allProducts);
    router.get("/fetch-single-product/:product_slug", fetchSingleProduct);
    router.get("/fetch-single-product-by-pid", fetchSingleProductByPid);
    router.get("/product-by-category", productByCategory);
    router.get("/fetch-top-selling-product", fetchTopSellingProduct);
    router.get("/manage-product", manageProduct);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
