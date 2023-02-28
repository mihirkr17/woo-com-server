import express, { Router } from "express";
const router: Router = express.Router();

const { verifyJWT, isRoleBuyer, } = require("../middleware/auth");
const { myOrder, removeOrder, cancelMyOrder } = require("../controllers/order/order.controller");

// set order controller
const SetOrder = require("../controllers/order/SetOrder");

const ConfirmOrder = require("../controllers/order/ConfirmOrder");

// single order controller
const SinglePurchaseOrder = require("../controllers/order/SinglePurchaseOrder");


try {
  router.post("/set-order", verifyJWT, isRoleBuyer, SetOrder);
  router.post("/confirm-order", verifyJWT, isRoleBuyer, ConfirmOrder);
  router.post("/single-purchase", verifyJWT, isRoleBuyer, SinglePurchaseOrder);

  router.get("/my-order/:email", verifyJWT, myOrder);
  router.delete("/remove-order/:email/:orderId", verifyJWT, removeOrder);
  router.put("/cancel-my-order/:userEmail", verifyJWT, cancelMyOrder);



} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
