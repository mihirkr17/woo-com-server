"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, isBuyer } = require("../middlewares/auth.middleware");
const { purchaseOne, purchaseCart, initializedOneForPurchase, } = require("../controllers/purchase.controller");
router.post("/init-one", verifyJWT, isBuyer, initializedOneForPurchase);
router.post("/one", verifyJWT, isBuyer, purchaseOne);
router.post("/cart", verifyJWT, isBuyer, purchaseCart);
module.exports = router;
