"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const productCTRL = require("../controllers/products.controller");
try {
    /**
     * @apiRoutes /api/product
     */
    router.get("/search-products/:q", productCTRL.searchProducts);
    router.get("/fetch-single-product/:product_slug", productCTRL.fetchProductDetails);
    router.get("/store/:limits", productCTRL.homeStoreController);
    router.get(`/:storeName`, productCTRL === null || productCTRL === void 0 ? void 0 : productCTRL.getStore);
    /**
      * @requestMethod GET
      * @controller productsByCategoryController
      * @required categories [Optional -> filters query]
      */
    router.post("/product-by-category", productCTRL.productsByCategoryController);
    router.get("/fetch-top-selling-product", productCTRL.fetchTopSellingProduct);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
