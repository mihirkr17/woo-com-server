import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT } = require("../middleware/auth");
const cartGetController = require("../controllers/cart/cartControllerGet");
const cartPostController = require("../controllers/cart/cartControllerPost");
const cartPutController = require("../controllers/cart/cartControllerPut");
const cartDeleteController = require("../controllers/cart/cartControllerDelete");

try {
  router.get("/show-my-cart-items", verifyJWT, cartGetController.showMyCartItemsController);

  router.post("/add-to-cart", verifyJWT, cartPostController.addToCartHandler);

  router.put("/add-buy-product", verifyJWT, cartPutController.addToBuyHandler);


  router.put('/update-cart-product-quantity', verifyJWT, cartPutController.updateCartProductQuantityController);

  router.post("/add-cart-address", verifyJWT, cartPostController.addCartAddress);
  router.put("/update-cart-address", verifyJWT, cartPutController.updateCartAddress);
  router.put("/select-address", verifyJWT, cartPutController.selectCartAddress);

  router.delete(
    "/delete-cart-address/:addressId",
    verifyJWT,
    cartDeleteController.deleteCartAddress
  );

  router.delete("/delete-cart-item/:cartTypes", verifyJWT, cartDeleteController.deleteCartItem);

} catch (error: any) {
  console.log(error?.message);
}


module.exports = router;