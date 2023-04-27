import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, isRoleBuyer } = require("../middlewares/auth.middleware");
const { addProductRating } = require("../controllers/review/review.controller");

try {
  router.put("/add-product-rating/:productID", verifyJWT, isRoleBuyer, addProductRating);
} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
