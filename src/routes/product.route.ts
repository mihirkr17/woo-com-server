import express, { Router } from "express";
const router: Router = express.Router();
const productCTRL = require("../controllers/products.controller");


try {
  /**
   * @apiRoutes /api/product
   */
  router.get("/search-products/:q", productCTRL.searchProducts);

  router.get("/fetch-single-product/:product_slug", productCTRL.fetchProductDetails);

  router.get("/store/:limits", productCTRL.homeStoreController);


  router.get(`/:storeTitle`, productCTRL?.getStore);

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
