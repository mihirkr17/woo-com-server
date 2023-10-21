import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, isAdmin } = require("../middlewares/auth.middleware");

const {
  adminOverview,
  verifyThisProduct,
  verifySellerAccount,
  deleteSupplierAccount,
  getBuyerInfo,
  allSuppliers,
  allBuyers,
} = require("../controllers/admin.controller");

router.get("/", verifyJWT, isAdmin, adminOverview);

router.put("/verify-product", verifyJWT, isAdmin, verifyThisProduct);

router.post("/verify-seller-account", verifyJWT, isAdmin, verifySellerAccount);

router.post(
  "/delete-supplier-account",
  verifyJWT,
  isAdmin,
  deleteSupplierAccount
);

router.post("/get-buyer-info", verifyJWT, isAdmin, getBuyerInfo);

router.get("/all-suppliers", verifyJWT, isAdmin, allSuppliers);

router.get("/all-buyers", verifyJWT, isAdmin, allBuyers);

module.exports = router;
