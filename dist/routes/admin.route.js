"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, isAdmin } = require("../middlewares/auth.middleware");
const { adminOverview, verifyThisProduct, verifySellerAccount, deleteSupplierAccount, getBuyerInfo, allSuppliers, allBuyers, } = require("../controllers/admin.controller");
router.get("/", verifyJWT, isAdmin, adminOverview);
router.put("/verify-product", verifyJWT, isAdmin, verifyThisProduct);
router.post("/verify-seller-account", verifyJWT, isAdmin, verifySellerAccount);
router.post("/delete-supplier-account", verifyJWT, isAdmin, deleteSupplierAccount);
router.post("/get-buyer-info", verifyJWT, isAdmin, getBuyerInfo);
router.get("/all-suppliers", verifyJWT, isAdmin, allSuppliers);
router.get("/all-buyers", verifyJWT, isAdmin, allBuyers);
module.exports = router;
