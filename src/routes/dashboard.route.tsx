import express, { Router } from "express";
const router: Router = express.Router();
const { variationOne } = require("../middleware/Product.middleware");
const { verifyJWT, isPermitForDashboard, isRoleSeller, isRoleAdmin } = require("../middleware/Auth.middleware");
const dashboardCTRL = require("../controllers/dashboard/dashboardController");
const ManageProductCTRL = require("../controllers/dashboard/ManageProduct.Controller");
const AdminCTRL = require("../controllers/dashboard/Admin.controller");
const ManageOrderCTRL = require("../controllers/dashboard/ManageOrdersController");

try {

  router.get("/overview", verifyJWT, isPermitForDashboard, dashboardCTRL?.dashboardOverview);

  router.put("/seller/:storeName/product-control", verifyJWT, isRoleSeller, ManageProductCTRL?.productControlController);

  router.put("/seller/:storeName/product/update-stock", verifyJWT, isRoleSeller, ManageProductCTRL.updateStockController);

  router.put("/seller/products/set-product-variation", verifyJWT, isRoleSeller, ManageProductCTRL.variationController);

  router.put("/seller/:storeName/start-flash-sale", verifyJWT, isRoleSeller, ManageProductCTRL?.productFlashSaleController);

  router.put("/admin/take-this-product", verifyJWT, isRoleAdmin, AdminCTRL?.takeThisProductByAdminController);

  router.post("/store/:storeName/order/order-status-management", verifyJWT, isRoleSeller, ManageOrderCTRL.orderStatusManagement);


  router.post('/seller/store/product/update-product/:paramsType', verifyJWT, isRoleSeller, ManageProductCTRL?.updateProductData);


  router.post("/verify-seller-account", verifyJWT, isRoleAdmin, AdminCTRL?.verifySellerAccountByAdmin);

  router.post("/delete-seller-account-request", verifyJWT, isRoleAdmin, AdminCTRL?.deleteSellerAccountRequest);

  router.post("/get-buyer-info", verifyJWT, isRoleAdmin, AdminCTRL?.getBuyerInfoByAdmin);


  // get controllers
  router.get("/view-products", verifyJWT, isPermitForDashboard, ManageProductCTRL.viewAllProductsInDashboard);

  router.get("/admin/:uuid/provider", verifyJWT, isRoleAdmin, AdminCTRL?.getAdminController);

  router.get("/store/:storeName/manage-orders", verifyJWT, isRoleSeller, ManageOrderCTRL?.manageOrders);

  router.get("/all-sellers", verifyJWT, isRoleAdmin, dashboardCTRL?.allSellers);

  router.get("/all-buyers", verifyJWT, isRoleAdmin, dashboardCTRL?.allBuyers);


  router.get("/seller/store/:storeName/in-queue-products", verifyJWT, isRoleSeller, ManageProductCTRL?.queueProductsController)

  /**
* @requestMethod GET
* @controller fetchSingleProductByPidController
* @desc --> Fetch Single Product By Product ID
* @required [pid -> query, ]
*/
  router.get("/get-one-product-in-seller-dsb", verifyJWT, isRoleSeller, ManageProductCTRL.getProductForSellerDSBController);

  // post controllers
  router.post("/seller/:storeName/product/listing/:formTypes/:_lid", verifyJWT, isRoleSeller, ManageProductCTRL.productListingController);

  // delete controller
  router.delete("/seller/:storeName/product/delete-product-variation/:productID/:vId", verifyJWT, ManageProductCTRL.deleteProductVariationController);
  router.delete("/:storeName/product/delete-product/:productID/:listingID", verifyJWT, isRoleSeller, ManageProductCTRL.deleteProductController);



} catch (error: any) {

}

module.exports = router;