"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT } = require("../middleware/auth");
const cartGetController = require("../controllers/cart/cartControllerGet");
const cartPostController = require("../controllers/cart/cartControllerPost");
const cartPutController = require("../controllers/cart/cartControllerPut");
const cartDeleteController = require("../controllers/cart/cartControllerDelete");
try {
    router.get("/show-my-cart-items", verifyJWT, cartGetController.showMyCartItemsController);
    router.post("/add-to-cart", verifyJWT, cartPostController.addToCartHandler);
    router.put("/add-buy-product", verifyJWT, cartPutController.addToBuyHandler);
    router.put('/update-cart-product-quantity', verifyJWT, cartPutController.updateCartProductQuantityController);
    router.delete("/delete-cart-item/:cartTypes", verifyJWT, cartDeleteController.deleteCartItem);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
