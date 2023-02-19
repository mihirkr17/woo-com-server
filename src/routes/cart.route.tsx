import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT } = require("../middleware/Auth.middleware");
const cartPostController = require("../controllers/cart/cartControllerPost");
const cartPutController = require("../controllers/cart/cartControllerPut");
const cartDeleteController = require("../controllers/cart/cartControllerDelete");
const cartContext = require("../controllers/cart/cart");

try {
  router.post("/add-to-cart", verifyJWT, cartPostController.addToCartHandler);

  router.get("/cart-context", verifyJWT, cartContext?.getCartContext);


  router.put('/update-cart-product-quantity', verifyJWT, cartPutController.updateCartProductQuantityController);

  router.delete("/delete-cart-item/:cartTypes", verifyJWT, cartDeleteController.deleteCartItem);

} catch (error: any) {
  console.log(error?.message);
}


module.exports = router;