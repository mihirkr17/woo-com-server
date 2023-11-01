"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { loginSystem, registrationSystem, accountVerifyByEmailSystem, sendOtpForForgotPwdChangeSystem, checkOtpForForgotPwdChangeSystem, setNewPwdForForgotPwdChangeSystem, } = require("../controllers/users.controller");
const { verifyEmailByJWT } = require("../middlewares/auth.middleware");
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
router.post("/supplier/login", loginSystem);
router.post("/supplier/register", supplierRegistrationMDL, registrationSystem);
module.exports = router;
