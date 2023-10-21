import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT } = require("../middlewares/auth.middleware");
const cartContext = require("../controllers/buyer.cart.controller");

try {
  router.post("/add-to-cart", verifyJWT, cartContext.addToCartHandler);

  router.get("/cart-context", verifyJWT, cartContext?.getCartContext);

  router.put('/update-cart-product-quantity', verifyJWT, cartContext.updateCartProductQuantityController);

  router.delete("/delete-cart-item/:productID/:sku/:cartTypes", verifyJWT, cartContext.deleteCartItem);

} catch (error: any) {
  console.log(error?.message);
}


module.exports = router;