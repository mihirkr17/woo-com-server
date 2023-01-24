import express, { Router } from "express";
const router: Router = express.Router();
const orderValidator = require("../middleware/OrderValidator.middleware");

const {
  verifyJWT,
  isRoleSeller,
  isRoleBuyer,
} = require("../middleware/auth");
const {
  setOrderHandler,
  myOrder,
  removeOrder,
  cancelMyOrder,
  dispatchOrderRequest,
  manageOrders,
} = require("../controllers/order/order.controller");

try {
  router.post("/set-order", verifyJWT, isRoleBuyer, orderValidator, setOrderHandler);
  router.get("/my-order/:email", myOrder);
  router.delete("/remove-order/:email/:orderId", verifyJWT, removeOrder);
  router.put("/cancel-my-order/:userEmail/:orderId", verifyJWT, cancelMyOrder);
  router.put(
    "/dispatch-order-request/:orderId/:trackingId",
    verifyJWT,
    isRoleSeller,
    dispatchOrderRequest
  );
  router.get("/manage-orders", manageOrders);
} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
