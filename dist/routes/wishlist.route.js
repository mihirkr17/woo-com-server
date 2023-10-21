"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { verifyJWT } = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
const { addToWishlistHandler, removeFromWishlist } = require("../controllers/buyer.wishlist.controller");
try {
    router.post("/add-to-wishlist/:email", verifyJWT, addToWishlistHandler);
    router.delete("/remove-from-wishlist/:productID", verifyJWT, removeFromWishlist);
}
catch (error) { }
module.exports = router;
