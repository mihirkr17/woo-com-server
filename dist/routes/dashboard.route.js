"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, isPermitForDashboard, isRoleSeller, isRoleAdmin } = require("../middlewares/auth.middleware");
const dashboardCTRL = require("../controllers/dashboard/dashboardController");
const ManageProductCTRL = require("../controllers/dashboard/ManageProduct.Controller");
const AdminCTRL = require("../controllers/dashboard/Admin.controller");
const ManageOrderCTRL = require("../controllers/dashboard/ManageOrdersController");
try {
    router.get("/overview", verifyJWT, isPermitForDashboard, dashboardCTRL === null || dashboardCTRL === void 0 ? void 0 : dashboardCTRL.dashboardOverview);
    router.put("/seller/:storeName/product-control", verifyJWT, isRoleSeller, ManageProductCTRL === null || ManageProductCTRL === void 0 ? void 0 : ManageProductCTRL.productControlController);
    router.put("/seller/:storeName/product/update-stock", verifyJWT, isRoleSeller, ManageProductCTRL.updateStockController);
    router.put("/seller/products/set-product-variation", verifyJWT, isRoleSeller, ManageProductCTRL.variationController);
    router.put("/seller/:storeName/start-flash-sale", verifyJWT, isRoleSeller, ManageProductCTRL === null || ManageProductCTRL === void 0 ? void 0 : ManageProductCTRL.productFlashSaleController);
    router.put("/admin/take-this-product", verifyJWT, isRoleAdmin, AdminCTRL === null || AdminCTRL === void 0 ? void 0 : AdminCTRL.takeThisProductByAdminController);
    router.post("/store/:storeName/order/order-status-management", verifyJWT, isRoleSeller, ManageOrderCTRL.orderStatusManagement);
    router.post('/seller/store/product/update-product/:paramsType', verifyJWT, isRoleSeller, ManageProductCTRL === null || ManageProductCTRL === void 0 ? void 0 : ManageProductCTRL.updateProductData);
    router.post("/verify-seller-account", verifyJWT, isRoleAdmin, AdminCTRL === null || AdminCTRL === void 0 ? void 0 : AdminCTRL.verifySellerAccountByAdmin);
    router.post("/delete-seller-account-request", verifyJWT, isRoleAdmin, AdminCTRL === null || AdminCTRL === void 0 ? void 0 : AdminCTRL.deleteSellerAccountRequest);
    router.post("/get-buyer-info", verifyJWT, isRoleAdmin, AdminCTRL === null || AdminCTRL === void 0 ? void 0 : AdminCTRL.getBuyerInfoByAdmin);
    // get controllers
    router.get("/view-products", verifyJWT, isPermitForDashboard, ManageProductCTRL.viewAllProductsInDashboard);
    router.get("/admin/:uuid/provider", verifyJWT, isRoleAdmin, AdminCTRL === null || AdminCTRL === void 0 ? void 0 : AdminCTRL.getAdminController);
    router.get("/store/:storeName/manage-orders", verifyJWT, isRoleSeller, ManageOrderCTRL === null || ManageOrderCTRL === void 0 ? void 0 : ManageOrderCTRL.manageOrders);
    router.get("/all-sellers", verifyJWT, isRoleAdmin, dashboardCTRL === null || dashboardCTRL === void 0 ? void 0 : dashboardCTRL.allSellers);
    router.get("/all-buyers", verifyJWT, isRoleAdmin, dashboardCTRL === null || dashboardCTRL === void 0 ? void 0 : dashboardCTRL.allBuyers);
    router.get("/seller/store/:storeName/in-queue-products", verifyJWT, isRoleSeller, ManageProductCTRL === null || ManageProductCTRL === void 0 ? void 0 : ManageProductCTRL.queueProductsController);
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
}
catch (error) {
}
module.exports = router;
