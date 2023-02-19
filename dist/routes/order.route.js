"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const orderValidator = require("../middleware/OrderValidator.middleware");
const { verifyJWT, isRoleBuyer, } = require("../middleware/auth");
const { myOrder, removeOrder, cancelMyOrder, } = require("../controllers/order/order.controller");
const SetOrder = require("../controllers/order/SetOrder");
try {
    router.post("/set-order", verifyJWT, isRoleBuyer, SetOrder);
    router.get("/my-order/:email", verifyJWT, myOrder);
    router.delete("/remove-order/:email/:orderId", verifyJWT, removeOrder);
    router.put("/cancel-my-order/:userEmail", verifyJWT, cancelMyOrder);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
