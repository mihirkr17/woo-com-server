"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, isBuyer, } = require("../middlewares/auth.middleware");
const { myOrder, removeOrder, cancelMyOrder, orderDetails } = require("../controllers/buyer.order.controller");
router.get("/my-order/:email", verifyJWT, isBuyer, myOrder);
router.delete("/remove-order/:email/:orderID", verifyJWT, isBuyer, removeOrder);
router.post("/cancel-my-order/:email", verifyJWT, isBuyer, cancelMyOrder);
router.get("/:orderId/:itemId/details", verifyJWT, isBuyer, orderDetails);
module.exports = router;
