import express, { Router } from "express";
const router: Router = express.Router();
const orderValidator = require("../middleware/OrderValidator.middleware");


const {
  verifyJWT,
  isRoleBuyer,
} = require("../middleware/auth");
const {
  myOrder,
  removeOrder,
  cancelMyOrder,
} = require("../controllers/order/order.controller");


const SetOrder = require("../controllers/order/SetOrder");
try {
  router.post("/set-order", verifyJWT, isRoleBuyer, SetOrder);
  router.get("/my-order/:email", verifyJWT, myOrder);
  router.delete("/remove-order/:email/:orderId", verifyJWT, removeOrder);
  router.put("/cancel-my-order/:userEmail", verifyJWT, cancelMyOrder);

} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
