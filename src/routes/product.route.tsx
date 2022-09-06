import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, verifySeller } = require("../middleware/auth");
const {
  searchProducts,
  topRatedProducts,
  topSellingProducts,
  countProducts,
  deleteProducts,
  updateProduct,
  updateStock,
  addProductHandler,
  allProducts,
  fetchSingleProduct,
  fetchSingleProductByPid,
  productByCategory,
  fetchTopSellingProduct,
  manageProduct
} = require("../controllers/product/product.controller");

try {
  router.get("/search-products/:q", searchProducts);
  router.get("/top_rated", topRatedProducts);
  router.get("/top_sell", topSellingProducts);
  router.get("/product-count", countProducts);
  router.delete("/delete-product/:productId", verifyJWT, deleteProducts);
  router.put("/update-product/:productId", verifyJWT, updateProduct);
  router.put("/update-stock", verifyJWT, verifySeller, updateStock);
  router.post("/add-product", verifyJWT, addProductHandler);
  router.get("/all-products/:limits", allProducts);
  router.get("/fetch-single-product/:product_slug", fetchSingleProduct);
  router.get("/fetch-single-product-by-pid", fetchSingleProductByPid);
  router.get("/product-by-category", productByCategory);
  router.get("/fetch-top-selling-product", fetchTopSellingProduct);
  router.get("/manage-product", manageProduct);
} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
