import express, { Router } from "express";
const router: Router = express.Router();

const { verifyJWT, loadWithJWT, isRoleBuyer, } = require("../middleware/Auth.middleware");
const { myOrder, removeOrder, cancelMyOrder } = require("../controllers/order/order.controller");

// set order controller
const CartPurchaseOrder = require("../controllers/order/CartPurchaseOrder");

const ConfirmOrder = require("../controllers/order/ConfirmOrder");

// single order controller
const SinglePurchaseOrder = require("../controllers/order/SinglePurchaseOrder");
// const SinglePurchaseOrderConfirm = require("../controllers/order/SinglePurchaseOrderConfirm");


try {
  router.post("/cart-purchase", verifyJWT, isRoleBuyer, CartPurchaseOrder);

  router.post("/single-purchase", verifyJWT, isRoleBuyer, SinglePurchaseOrder);

  router.post("/confirm-order", verifyJWT, isRoleBuyer, ConfirmOrder);

  // router.post("/confirm-single-purchase-order", verifyJWT, isRoleBuyer, SinglePurchaseOrderConfirm);

  router.get("/my-order/:email", verifyJWT, isRoleBuyer, myOrder);
  router.delete("/remove-order/:email/:orderID", verifyJWT, isRoleBuyer, removeOrder);
  router.put("/cancel-my-order/:email", verifyJWT, isRoleBuyer, cancelMyOrder);
} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
