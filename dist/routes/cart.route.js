"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT } = require("../middleware/Auth.middleware");
const cartPostController = require("../controllers/cart/cartControllerPost");
const cartPutController = require("../controllers/cart/cartControllerPut");
const cartDeleteController = require("../controllers/cart/cartControllerDelete");
const cartContext = require("../controllers/cart/cart");
try {
    router.post("/add-to-cart", verifyJWT, cartPostController.addToCartHandler);
    router.get("/cart-context", verifyJWT, cartContext === null || cartContext === void 0 ? void 0 : cartContext.getCartContext);
    router.put('/update-cart-product-quantity', verifyJWT, cartPutController.updateCartProductQuantityController);
    router.delete("/delete-cart-item/:cartTypes", verifyJWT, cartDeleteController.deleteCartItem);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
