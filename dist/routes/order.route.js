"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, verifySeller, verifyUser, } = require("../middleware/auth");
const { setOrderHandler, myOrder, removeOrder, cancelMyOrder, dispatchOrderRequest, manageOrders, } = require("../controllers/order/order.controller");
try {
    router.post("/set-order", verifyJWT, verifyUser, setOrderHandler);
    router.get("/my-order/:email", myOrder);
    router.delete("/remove-order/:email/:orderId", verifyJWT, removeOrder);
    router.put("/cancel-my-order/:userEmail/:orderId", verifyJWT, cancelMyOrder);
    router.put("/dispatch-order-request/:orderId/:trackingId", verifyJWT, verifySeller, dispatchOrderRequest);
    router.get("/manage-orders", manageOrders);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
