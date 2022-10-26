import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, checkingSeller } = require("../middleware/auth");
const { variationOne } = require("../middleware/product.middleware");
const {
  homeStoreController,
  searchProducts,
  topRatedProducts,
  topSellingProducts,
  countProductsController,
  deleteProductController,
  updateProductController,
  updateStockController,
  addProductHandler,
  allProducts,
  fetchSingleProductController,
  fetchSingleProductByPidController,
  productsByCategoryController,
  fetchTopSellingProduct,
  manageProductController,
  setProductIntroController,
  dashboardOverviewController,
  productVariationController,
  deleteProductVariationController
} = require("../controllers/product/product.controller");

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


} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
