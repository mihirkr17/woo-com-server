"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, isRoleBuyer, } = require("../middlewares/auth.middleware");
const { myOrder, removeOrder, cancelMyOrder, orderDetails } = require("../controllers/order/order.controller");
// set order controller
const CartPurchaseOrder = require("../controllers/order/CartPurchaseOrder");
const ConfirmOrder = require("../controllers/order/ConfirmOrder");
// single order controller
const SinglePurchaseOrder = require("../controllers/order/SinglePurchaseOrder");
try {
    router.post("/cart-purchase", verifyJWT, isRoleBuyer, CartPurchaseOrder);
    router.post("/single-purchase", verifyJWT, isRoleBuyer, SinglePurchaseOrder);
    router.post("/confirm-order", verifyJWT, isRoleBuyer, ConfirmOrder);
    router.get("/my-order/:email", verifyJWT, isRoleBuyer, myOrder);
    router.delete("/remove-order/:email/:orderID", verifyJWT, isRoleBuyer, removeOrder);
    router.post("/cancel-my-order/:email", verifyJWT, isRoleBuyer, cancelMyOrder);
    router.get("/:orderId/:itemId/details", verifyJWT, isRoleBuyer, orderDetails);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
