import express, { Router } from "express";
const router: Router = express.Router();
const authCTRL = require("../controllers/auth/authentication");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { loginMDL, registrationMDL, sellerRegistrationMDL } = require("../middlewares/formInput.middleware");


try {

   router.post("/register-new-user", registrationMDL, authCTRL.buyerRegistrationController);

   router.post("/login", loginMDL, authCTRL.loginController);

   // router.post("/sign-out", authCTRL.signOutController);

   router.post("/register-new-seller", sellerRegistrationMDL, authCTRL.sellerRegistrationController);

   router.post("/verify-register-user", authCTRL.userEmailVerificationController);

   router.get('/generate-verification-code', authCTRL?.generateNewVerificationCode);

   router.post("/user/changed-password", verifyJWT, authCTRL?.changePasswordController);

   router.post("/check-user-authentication", authCTRL?.checkUserAuthentication);

   router.post("/check-user-forgot-pwd-security-key", authCTRL?.checkUserForgotPwdSecurityKey);

   router.post("/user/set-new-password", authCTRL?.userSetNewPassword);

} catch (error: any) {

}


module.exports = router;