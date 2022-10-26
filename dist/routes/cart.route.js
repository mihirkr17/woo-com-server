"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT } = require("../middleware/auth");
const { showMyCartItemsController, updateProductQuantity, deleteCartItem, addToCartHandler, addToBuyHandler, addCartAddress, updateCartAddress, selectCartAddress, deleteCartAddress, checkCartItemExpirationController, updateCartProductQuantityController } = require("../controllers/cart/cart.controller");
try {
    router.get("/show-my-cart-items", verifyJWT, showMyCartItemsController);
    router.post("/add-to-cart", verifyJWT, addToCartHandler);
    router.put("/add-buy-product", verifyJWT, addToBuyHandler);
    router.put("/update-product-quantity/:cartTypes", verifyJWT, updateProductQuantity);
    router.put('/update-cart-product-quantity', verifyJWT, updateCartProductQuantityController);
    router.post("/add-cart-address", verifyJWT, addCartAddress);
    router.put("/update-cart-address", verifyJWT, updateCartAddress);
    router.put("/select-address", verifyJWT, selectCartAddress);
    router.delete("/delete-cart-address/:addressId", verifyJWT, deleteCartAddress);
    router.delete("/delete-cart-item/:cartTypes", verifyJWT, deleteCartItem);
    router.delete("/check-cart-item-expiration/:productId", verifyJWT, checkCartItemExpirationController);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
