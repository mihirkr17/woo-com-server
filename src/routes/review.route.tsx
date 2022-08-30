import express, { Router } from "express";
const router: Router = express.Router();
const { verifyUser } = require("../middleware/auth");
const { addProductRating } = require("../controllers/review/review.controller");

try {
  router.put("/add-product-rating/:productId", verifyUser, addProductRating);
} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
