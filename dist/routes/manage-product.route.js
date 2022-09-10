"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { manageProduct, } = require("../controllers/manage-product/manage-product.controller");
try {
    router.get("/manage-product", manageProduct);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;