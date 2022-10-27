import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, checkingSeller } = require("../middleware/auth");
const { variationOne } = require("../middleware/product.middleware");
const deleteController = require("../controllers/product/productControllerDelete");
const getController = require("../controllers/product/productControllerGet");
const postController = require("../controllers/product/productControllerPost");
const putController = require("../controllers/product/productControllerPut");

try {
  /**
   * @apiRoutes /api/product
   */
  router.get("/search-products/:q", getController.searchProducts);
  router.get("/product-count", getController.countProductsController);
  router.delete("/delete-product", verifyJWT, checkingSeller, deleteController.deleteProductController);
  router.put("/update-stock", verifyJWT, checkingSeller, putController.updateStockController);
  router.post("/set-product-intro/:formTypes", verifyJWT, postController.setProductIntroController);
  router.put("/set-product-details", verifyJWT, putController.updateProductController);

  router.get("/fetch-single-product/:product_slug", getController.fetchSingleProductController);

  router.get("/store/:limits", getController.homeStoreController);

  /**
   * @requestMethod GET
   * @controller fetchSingleProductByPidController
   * @desc --> Fetch Single Product By Product ID
   * @required [pid -> query, ]
   */
  router.get("/fetch-single-product-by-pid", getController.fetchSingleProductByPidController);

  /**
    * @requestMethod GET
    * @controller productsByCategoryController
    * @required categories [Optional -> filters query]
    */
  router.get("/product-by-category", getController.productsByCategoryController);


  router.get("/fetch-top-selling-product", getController.fetchTopSellingProduct);
  router.get("/manage-product", verifyJWT, getController.manageProductController);

  router.get("/dashboard-overview", verifyJWT, getController.dashboardOverviewController);


  router.put("/set-product-variation", verifyJWT, variationOne, putController.productVariationController);

  router.delete("/delete-product-variation/:productId/:vId", verifyJWT, deleteController.deleteProductVariationController);


} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
