import express, { Router } from "express";
const router: Router = express.Router();
const authCTRL = require("../controllers/auth/userAuthController");


const { supplierRegistrationController, supplierLoginController, supplierAccountVerifyByEmail } = require("../controllers/auth/supplierAuthController");


const { verifyJWT, verifyEmailByJWT } = require("../middlewares/auth.middleware");
const { loginMDL, registrationMDL, supplierRegistrationMDL } = require("../middlewares/formInput.middleware");


try {

   router.post("/register-new-user", registrationMDL, authCTRL.userRegistrationController);

   router.post("/login", loginMDL, authCTRL.userLoginController);


   router.post("/verify-user-register-email", authCTRL.userAccountVerifyByEmail);

   router.get('/generate-verification-code', authCTRL?.generateNewVerifyToken);

   router.post("/user/changed-password", verifyJWT, authCTRL?.changePasswordController);

   router.post("/check-user-authentication", authCTRL?.checkUserAuthenticationByEmail);

   router.post("/check-user-forgot-pwd-security-key", authCTRL?.checkUserForgotPwdSecurityKey);

   router.post("/user/set-new-password", authCTRL?.userSetNewPassword);


   // supplier routes
   router.post("/supplier/login", supplierLoginController);

   router.post("/supplier/register", supplierRegistrationMDL, supplierRegistrationController);

   router.post("/verify-email", verifyEmailByJWT, supplierAccountVerifyByEmail);

} catch (error: any) {

}


module.exports = router;