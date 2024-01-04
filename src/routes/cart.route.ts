import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT } = require("../middlewares/auth.middleware");
const cartContext = require("../controllers/customer.cart.controller");

router.post("/add-to-cart", verifyJWT, cartContext.addToCartSystem);

router.get("/cart-context", verifyJWT, cartContext?.getCartContextSystem);

router.put(
  "/update-cart-product-quantity",
  verifyJWT,
  cartContext.updateCartProductQuantitySystem
);

router.delete(
  "/delete-cart-item/:cartId",
  verifyJWT,
  cartContext.deleteCartItemSystem
);

module.exports = router;
