import express, { Router } from "express";
const router: Router = express.Router();
const buyerAuthCTRL = require("../controllers/buyer.auth.controller");


const { supplierRegistrationController, supplierLoginController, supplierAccountVerifyByEmail } = require("../controllers/supplier.auth.controller");


const { verifyJWT, verifyEmailByJWT } = require("../middlewares/auth.middleware");
const { loginMDL, registrationMDL, supplierRegistrationMDL } = require("../middlewares/formInput.middleware");


try {

   router.post("/register-new-user", registrationMDL, buyerAuthCTRL.userRegistrationController);

   router.post("/login", loginMDL, buyerAuthCTRL.userLoginController);

   router.post("/verify-user-register-email", buyerAuthCTRL.userAccountVerifyByEmail);

   router.get('/generate-verification-code', buyerAuthCTRL?.generateNewVerifyToken);

   router.post("/user/changed-password", verifyJWT, buyerAuthCTRL?.changePasswordController);

   router.post("/check-user-authentication", buyerAuthCTRL?.checkUserAuthenticationByEmail);

   router.post("/check-user-forgot-pwd-security-key", buyerAuthCTRL?.checkUserForgotPwdSecurityKey);

   router.post("/user/set-new-password", buyerAuthCTRL?.userSetNewPassword);


   // supplier routes
   router.post("/supplier/login", supplierLoginController);

   router.post("/supplier/register", supplierRegistrationMDL, supplierRegistrationController);

   router.post("/verify-email", verifyEmailByJWT, supplierAccountVerifyByEmail);

} catch (error: any) {

}


module.exports = router;