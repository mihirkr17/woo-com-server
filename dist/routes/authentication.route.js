"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const buyerAuthCTRL = require("../controllers/buyer.auth.controller");
const { supplierRegistrationController, supplierLoginController, supplierAccountVerifyByEmail } = require("../controllers/supplier.auth.controller");
const { verifyJWT, verifyEmailByJWT } = require("../middlewares/auth.middleware");
const { loginMDL, registrationMDL, supplierRegistrationMDL } = require("../middlewares/formInput.middleware");
try {
    router.post("/register-new-user", registrationMDL, buyerAuthCTRL.userRegistrationController);
    router.post("/login", loginMDL, buyerAuthCTRL.userLoginController);
    router.post("/verify-user-register-email", buyerAuthCTRL.userAccountVerifyByEmail);
    router.get('/generate-verification-code', buyerAuthCTRL === null || buyerAuthCTRL === void 0 ? void 0 : buyerAuthCTRL.generateNewVerifyToken);
    router.post("/user/changed-password", verifyJWT, buyerAuthCTRL === null || buyerAuthCTRL === void 0 ? void 0 : buyerAuthCTRL.changePasswordController);
    router.post("/check-user-authentication", buyerAuthCTRL === null || buyerAuthCTRL === void 0 ? void 0 : buyerAuthCTRL.checkUserAuthenticationByEmail);
    router.post("/check-user-forgot-pwd-security-key", buyerAuthCTRL === null || buyerAuthCTRL === void 0 ? void 0 : buyerAuthCTRL.checkUserForgotPwdSecurityKey);
    router.post("/user/set-new-password", buyerAuthCTRL === null || buyerAuthCTRL === void 0 ? void 0 : buyerAuthCTRL.userSetNewPassword);
    // supplier routes
    router.post("/supplier/login", supplierLoginController);
    router.post("/supplier/register", supplierRegistrationMDL, supplierRegistrationController);
    router.post("/verify-email", verifyEmailByJWT, supplierAccountVerifyByEmail);
}
catch (error) {
}
module.exports = router;
