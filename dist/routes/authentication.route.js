"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const buyerAuthCTRL = require("../controllers/buyer.auth.controller");
const { loginSystem, registrationSystem, accountVerifyByEmailSystem, sendOtpForForgotPwdChangeSystem, checkOtpForForgotPwdChangeSystem, setNewPwdForForgotPwdChangeSystem, } = require("../controllers/auth.controller");
const { supplierRegistrationController, supplierLoginController, supplierAccountVerifyByEmail, } = require("../controllers/supplier.auth.controller");
const { verifyJWT, verifyEmailByJWT, } = require("../middlewares/auth.middleware");
const { loginMDL, registrationMDL, supplierRegistrationMDL, } = require("../middlewares/formInput.middleware");
// modified
router.post("/registration", registrationMDL, registrationSystem);
router.post("/login", loginMDL, loginSystem);
router.get("/verify-email", verifyEmailByJWT, accountVerifyByEmailSystem);
router.post("/forgot-pwd/send-otp", sendOtpForForgotPwdChangeSystem);
router.post("/submit-otp", checkOtpForForgotPwdChangeSystem);
router.post("/set-new-password", setNewPwdForForgotPwdChangeSystem);
// unmodified
// supplier routes
router.post("/supplier/login", supplierLoginController);
router.post("/supplier/register", supplierRegistrationMDL, supplierRegistrationController);
module.exports = router;
