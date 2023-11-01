import express, { Router } from "express";
const router: Router = express.Router();

const { verifyJWT, isCustomer, } = require("../middlewares/auth.middleware");
const { myOrder, removeOrder, cancelMyOrder, orderDetails } = require("../controllers/buyer.order.controller");

router.get("/my-order/:email", verifyJWT, isCustomer, myOrder);
router.delete("/remove-order/:email/:orderID", verifyJWT, isCustomer, removeOrder);

router.post("/cancel-my-order/:email", verifyJWT, isCustomer, cancelMyOrder);

router.get("/:orderId/:itemId/details", verifyJWT, isCustomer, orderDetails);

module.exports = router;
