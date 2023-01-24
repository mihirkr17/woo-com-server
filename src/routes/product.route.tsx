import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, isRoleSeller, isPermitForDashboard } = require("../middleware/Auth.middleware");
const { variationOne } = require("../middleware/Product.middleware");
const deleteController = require("../controllers/product/productControllerDelete");
const getController = require("../controllers/product/productControllerGet");
const postController = require("../controllers/product/productControllerPost");
const putController = require("../controllers/product/productControllerPut");

try {
  /**
   * @apiRoutes /api/product
   */
  router.get("/search-products/:q", getController.searchProducts);
  router.delete("/delete-product", verifyJWT, isRoleSeller, deleteController.deleteProductController);
  router.put("/update-stock", verifyJWT, isRoleSeller, putController.updateStockController);
  router.post("/set-product-intro/:formTypes", verifyJWT, isRoleSeller, postController.setProductIntroController);

  router.get("/fetch-single-product/:product_slug", getController.fetchSingleProductController);

  router.get("/store/:limits", getController.homeStoreController);

  /**
   * @requestMethod GET
   * @controller fetchSingleProductByPidController
   * @desc --> Fetch Single Product By Product ID
   * @required [pid -> query, ]
   */
  router.get("/get-one-product-in-seller-dsb", verifyJWT, isRoleSeller, getController.getProductForSellerDSBController);

  /**
    * @requestMethod GET
    * @controller productsByCategoryController
    * @required categories [Optional -> filters query]
    */
  router.get("/product-by-category", getController.productsByCategoryController);


  router.get("/fetch-top-selling-product", getController.fetchTopSellingProduct);
  router.get("/manage-product", verifyJWT, isPermitForDashboard, getController.manageProductController);


  router.put("/set-product-variation", verifyJWT, variationOne, putController.productOperationController);

  router.put("/product-control", verifyJWT, isRoleSeller, putController.productControlController);

  router.delete("/delete-product-variation/:productId/:vId", verifyJWT, deleteController.deleteProductVariationController);


} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
