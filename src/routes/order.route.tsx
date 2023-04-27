import express, { Router } from "express";
const router: Router = express.Router();

const { verifyJWT, isRoleBuyer, } = require("../middlewares/auth.middleware");
const { myOrder, removeOrder, cancelMyOrder } = require("../controllers/order/order.controller");

// set order controller
const CartPurchaseOrder = require("../controllers/order/CartPurchaseOrder");

const ConfirmOrder = require("../controllers/order/ConfirmOrder");

// single order controller
const SinglePurchaseOrder = require("../controllers/order/SinglePurchaseOrder");



try {
  router.post("/cart-purchase", verifyJWT, isRoleBuyer, CartPurchaseOrder);

  router.post("/single-purchase", verifyJWT, isRoleBuyer, SinglePurchaseOrder);

  router.post("/confirm-order", verifyJWT, isRoleBuyer, ConfirmOrder);

  router.get("/my-order/:email", verifyJWT, isRoleBuyer, myOrder);
  router.delete("/remove-order/:email/:orderID", verifyJWT, isRoleBuyer, removeOrder);
  router.put("/cancel-my-order/:email", verifyJWT, isRoleBuyer, cancelMyOrder);
} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
