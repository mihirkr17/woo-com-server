import express, { Router } from "express";
const router: Router = express.Router();
const authCTRL = require("../controllers/auth/authentication");


const { supplierRegistrationController, supplierLoginController, supplierEmailVerify } = require("../controllers/auth/supplierAuthController");


const { verifyJWT, verifyEmailByJWT } = require("../middlewares/auth.middleware");
const { loginMDL, registrationMDL, supplierRegistrationMDL } = require("../middlewares/formInput.middleware");


try {

   router.post("/register-new-user", registrationMDL, authCTRL.buyerRegistrationController);

   router.post("/login", loginMDL, authCTRL.loginController);


   router.post("/verify-register-user", authCTRL.userEmailVerificationController);

   router.get('/generate-verification-code', authCTRL?.generateNewVerificationCode);

   router.post("/user/changed-password", verifyJWT, authCTRL?.changePasswordController);

   router.post("/check-user-authentication", authCTRL?.checkUserAuthenticationByEmail);

   router.post("/check-user-forgot-pwd-security-key", authCTRL?.checkUserForgotPwdSecurityKey);

   router.post("/user/set-new-password", authCTRL?.userSetNewPassword);


   // supplier routes
   router.post("/supplier/login", supplierLoginController);

   router.post("/supplier/register", supplierRegistrationMDL, supplierRegistrationController);

   router.post("/verify-email", verifyEmailByJWT, supplierEmailVerify);

} catch (error: any) {

}


module.exports = router;