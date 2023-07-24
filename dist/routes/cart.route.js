"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT } = require("../middlewares/auth.middleware");
const cartContext = require("../controllers/cart/cart");
try {
    router.post("/add-to-cart", verifyJWT, cartContext.addToCartHandler);
    router.get("/cart-context", verifyJWT, cartContext === null || cartContext === void 0 ? void 0 : cartContext.getCartContext);
    router.put('/update-cart-product-quantity', verifyJWT, cartContext.updateCartProductQuantityController);
    router.delete("/delete-cart-item/:productID/:sku/:cartTypes", verifyJWT, cartContext.deleteCartItem);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
