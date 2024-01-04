"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT } = require("../middlewares/auth.middleware");
const cartContext = require("../controllers/customer.cart.controller");
router.post("/add-to-cart", verifyJWT, cartContext.addToCartSystem);
router.get("/cart-context", verifyJWT, cartContext === null || cartContext === void 0 ? void 0 : cartContext.getCartContextSystem);
router.put("/update-cart-product-quantity", verifyJWT, cartContext.updateCartProductQuantitySystem);
router.delete("/delete-cart-item/:cartId", verifyJWT, cartContext.deleteCartItemSystem);
module.exports = router;
