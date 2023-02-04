import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, isRoleSeller, isPermitForDashboard } = require("../middleware/Auth.middleware");
const getController = require("../controllers/product/productControllerGet");

try {
  /**
   * @apiRoutes /api/product
   */
  router.get("/search-products/:q", getController.searchProducts);

  router.get("/fetch-single-product/:product_slug", getController.fetchSingleProductController);

  router.get("/store/:limits", getController.homeStoreController);

  /**
    * @requestMethod GET
    * @controller productsByCategoryController
    * @required categories [Optional -> filters query]
    */
  router.get("/product-by-category", getController.productsByCategoryController);


  router.get("/fetch-top-selling-product", getController.fetchTopSellingProduct);
} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
