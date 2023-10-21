import express, { Router } from "express";
const { verifyJWT } = require("../middlewares/auth.middleware");
const router: Router = express.Router();
const {
  addToWishlistHandler,
  removeFromWishlist
} = require("../controllers/buyer.wishlist.controller");

try {
  router.post("/add-to-wishlist/:email", verifyJWT, addToWishlistHandler);
  router.delete("/remove-from-wishlist/:productID", verifyJWT, removeFromWishlist);
} catch (error) { }

module.exports = router;
