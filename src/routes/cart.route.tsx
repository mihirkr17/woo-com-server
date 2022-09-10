import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT } = require("../middleware/auth");
const {
  updateProductQuantity,
  deleteCartItem,
  addToCartHandler,
  addToBuyHandler,
  addCartAddress,
  updateCartAddress,
  selectCartAddress,
  deleteCartAddress,
} = require("../controllers/cart/cart.controller");

try {
  router.post("/add-to-cart", verifyJWT, addToCartHandler);
  router.put("/add-buy-product", verifyJWT, addToBuyHandler);
  router.put(
    "/update-product-quantity/:cartTypes",
    verifyJWT,
    updateProductQuantity
  );

  router.post("/add-cart-address", verifyJWT, addCartAddress);
  router.put("/update-cart-address", verifyJWT, updateCartAddress);
  router.put("/select-address", verifyJWT, selectCartAddress);
  router.delete(
    "/delete-cart-address/:addressId",
    verifyJWT,
    deleteCartAddress
  );

  router.delete("/delete-cart-item/:cartTypes", verifyJWT, deleteCartItem);
} catch (error: any) {
  console.log(error?.message);
}


module.exports = router;