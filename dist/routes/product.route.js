"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, isRoleBuyer } = require("../middleware/Auth.middleware");
const productCTRL = require("../controllers/product/product.controller");
try {
    /**
     * @apiRoutes /api/product
     */
    router.get("/search-products/:q", productCTRL.searchProducts);
    router.get("/fetch-single-product/:product_slug", productCTRL.fetchSingleProductController);
    router.get("/store/:limits", productCTRL.homeStoreController);
    router.post("/purchase", verifyJWT, isRoleBuyer, productCTRL === null || productCTRL === void 0 ? void 0 : productCTRL.purchaseProductController);
    /**
      * @requestMethod GET
      * @controller productsByCategoryController
      * @required categories [Optional -> filters query]
      */
    router.get("/product-by-category", productCTRL.productsByCategoryController);
    router.get("/fetch-top-selling-product", productCTRL.fetchTopSellingProduct);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
