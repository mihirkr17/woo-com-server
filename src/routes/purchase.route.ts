import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, isBuyer } = require("../middlewares/auth.middleware");

const {
  purchaseOne,
  purchaseCart,
  initializedOneForPurchase,
} = require("../controllers/purchase.controller");

router.post("/init-one", verifyJWT, isBuyer, initializedOneForPurchase);
router.post("/one", verifyJWT, isBuyer, purchaseOne);
router.post("/cart", verifyJWT, isBuyer, purchaseCart);

module.exports = router;
