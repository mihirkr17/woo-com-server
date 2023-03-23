"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const authCTRL = require("../controllers/auth/authentication");
const { verifyJWT } = require("../middleware/Auth.middleware");
const { loginMDL, registrationMDL } = require("../middleware/authentication.mdl");
try {
    router.post("/register-new-user", registrationMDL, authCTRL.buyerRegistrationController);
    router.post("/login", loginMDL, authCTRL.loginController);
    router.post("/sign-out", authCTRL.signOutController);
    router.post("/register-new-seller", authCTRL.sellerRegistrationController);
    router.get("/verify-register-user", authCTRL.userEmailVerifyTokenController);
    router.post("/user/changed-password", verifyJWT, authCTRL === null || authCTRL === void 0 ? void 0 : authCTRL.changePasswordController);
    router.post("/check-user-authentication", authCTRL === null || authCTRL === void 0 ? void 0 : authCTRL.checkUserAuthentication);
    router.post("/check-user-forgot-pwd-security-key", authCTRL === null || authCTRL === void 0 ? void 0 : authCTRL.checkUserForgotPwdSecurityKey);
    router.post("/user/set-new-password", authCTRL === null || authCTRL === void 0 ? void 0 : authCTRL.userSetNewPassword);
}
catch (error) {
}
module.exports = router;
