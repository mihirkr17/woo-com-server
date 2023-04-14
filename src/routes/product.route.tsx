import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, isRoleBuyer } = require("../middleware/Auth.middleware");
const productCTRL = require("../controllers/product/product.controller");

try {
  /**
   * @apiRoutes /api/product
   */
  router.get("/search-products/:q", productCTRL.searchProducts);

  router.get("/fetch-single-product/:product_slug", productCTRL.fetchSingleProductController);

  router.get("/store/:limits", productCTRL.homeStoreController);

  router.post("/purchase", verifyJWT, isRoleBuyer, productCTRL?.purchaseProductController);

  /**
    * @requestMethod GET
    * @controller productsByCategoryController
    * @required categories [Optional -> filters query]
    */
  router.post("/product-by-category", productCTRL.productsByCategoryController);


  router.get("/fetch-top-selling-product", productCTRL.fetchTopSellingProduct);
} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
