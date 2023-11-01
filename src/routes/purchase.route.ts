import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, isCustomer } = require("../middlewares/auth.middleware");

const {
  purchaseOne,
  purchaseCart,
  initializedOneForPurchase,
} = require("../controllers/purchase.controller");

router.post("/init-one", verifyJWT, isCustomer, initializedOneForPurchase);
router.post("/one", verifyJWT, isCustomer, purchaseOne);
router.post("/cart", verifyJWT, isCustomer, purchaseCart);

module.exports = router;
