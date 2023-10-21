import express, { Router } from "express";
const router: Router = express.Router();

const { verifyJWT, isBuyer, } = require("../middlewares/auth.middleware");
const { myOrder, removeOrder, cancelMyOrder, orderDetails } = require("../controllers/buyer.order.controller");

router.get("/my-order/:email", verifyJWT, isBuyer, myOrder);
router.delete("/remove-order/:email/:orderID", verifyJWT, isBuyer, removeOrder);

router.post("/cancel-my-order/:email", verifyJWT, isBuyer, cancelMyOrder);

router.get("/:orderId/:itemId/details", verifyJWT, isBuyer, orderDetails);

module.exports = router;
