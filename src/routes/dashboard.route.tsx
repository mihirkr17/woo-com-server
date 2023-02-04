import express, { Router } from "express";
const router: Router = express.Router();
const { variationOne } = require("../middleware/Product.middleware");
const { verifyJWT, isPermitForDashboard, isRoleSeller } = require("../middleware/Auth.middleware");
const dashboardCTL = require("../controllers/dashboard/dashboardController");
const ManageProductCTL = require("../controllers/dashboard/ManageProduct.Controller");

try {

   router.get("/overview", verifyJWT, isPermitForDashboard, dashboardCTL?.dashboardOverview);

   router.put("/seller/:storeName/product-control", verifyJWT, isRoleSeller, ManageProductCTL?.productControlController);

   router.put("/seller/:storeName/product/update-stock", verifyJWT, isRoleSeller, ManageProductCTL.updateStockController);

   router.put("/seller/products/set-product-variation", verifyJWT, variationOne, ManageProductCTL.productOperationController);



   // get controllers

   router.get("/view-products", verifyJWT, isPermitForDashboard, ManageProductCTL.viewAllProductsInDashboard);

   /**
 * @requestMethod GET
 * @controller fetchSingleProductByPidController
 * @desc --> Fetch Single Product By Product ID
 * @required [pid -> query, ]
 */
   router.get("/get-one-product-in-seller-dsb", verifyJWT, isRoleSeller, ManageProductCTL.getProductForSellerDSBController);


   // post controllers
   router.post("/seller/:storeName/product/set-product-intro/:formTypes", verifyJWT, isRoleSeller, ManageProductCTL.setProductIntroController);


   // delete controller
   router.delete("/seller/:storeName/product/delete-product-variation/:productId/:vId", verifyJWT, ManageProductCTL.deleteProductVariationController);
   router.delete("/:storeName/product/delete-product", verifyJWT, isRoleSeller, ManageProductCTL.deleteProductController);

} catch (error: any) {

}

module.exports = router;