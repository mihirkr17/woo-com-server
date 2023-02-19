"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, isRoleSeller, isPermitForDashboard } = require("../middleware/Auth.middleware");
const getController = require("../controllers/product/product.controller");
try {
    /**
     * @apiRoutes /api/product
     */
    router.get("/search-products/:q", getController.searchProducts);
    router.get("/fetch-single-product/:product_slug", getController.fetchSingleProductController);
    router.get("/store/:limits", getController.homeStoreController);
    router.post("/purchase", verifyJWT, getController === null || getController === void 0 ? void 0 : getController.purchaseProductController);
    /**
      * @requestMethod GET
      * @controller productsByCategoryController
      * @required categories [Optional -> filters query]
      */
    router.get("/product-by-category", getController.productsByCategoryController);
    router.get("/fetch-top-selling-product", getController.fetchTopSellingProduct);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
