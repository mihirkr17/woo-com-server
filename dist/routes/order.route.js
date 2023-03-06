"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, isRoleBuyer, } = require("../middleware/auth");
const { myOrder, removeOrder, cancelMyOrder } = require("../controllers/order/order.controller");
// set order controller
const SetOrder = require("../controllers/order/SetOrder");
const ConfirmOrder = require("../controllers/order/ConfirmOrder");
// single order controller
const SinglePurchaseOrder = require("../controllers/order/SinglePurchaseOrder");
try {
    router.post("/set-order", verifyJWT, isRoleBuyer, SetOrder);
    router.post("/confirm-order", verifyJWT, isRoleBuyer, ConfirmOrder);
    router.post("/single-purchase", verifyJWT, isRoleBuyer, SinglePurchaseOrder);
    router.get("/my-order/:email", verifyJWT, isRoleBuyer, myOrder);
    router.delete("/remove-order/:email/:orderId", verifyJWT, isRoleBuyer, removeOrder);
    router.put("/cancel-my-order/:userEmail", verifyJWT, isRoleBuyer, cancelMyOrder);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
