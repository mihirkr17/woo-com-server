import express, { Router } from "express";
const router: Router = express.Router();
const {
  verifyJWT,
  verifySeller,
  verifyUser,
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
  router.post("/set-order", verifyJWT, verifyUser, setOrderHandler);
  router.get("/my-order/:email", myOrder);
  router.delete("/remove-order/:email/:orderId", verifyJWT, removeOrder);
  router.put("/cancel-my-order/:userEmail/:orderId", verifyJWT, cancelMyOrder);
  router.put(
    "/dispatch-order-request/:orderId/:trackingId",
    verifyJWT,
    verifySeller,
    dispatchOrderRequest
  );
  router.get("/manage-orders", manageOrders);
} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
