import express, { Router } from "express";
const { verifyJWT } = require("../middleware/Auth.middleware");
const router: Router = express.Router();
const {
  addToWishlistHandler,
  removeFromWishlistHandler
} = require("../controllers/wishlist/wishlist.controller");

try {
  router.put("/add-to-wishlist/:email", verifyJWT, addToWishlistHandler);
  router.delete("/remove-from-wishlist/:productId", verifyJWT, removeFromWishlistHandler);
} catch (error) {}

module.exports = router;
