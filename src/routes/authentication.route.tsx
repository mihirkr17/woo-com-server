import express, { Router } from "express";
const router: Router = express.Router();
const authCTRL = require("../controllers/auth/authentication");
const formInputValidator = require("../middleware/FormInputValidator.middleware");


try {

   router.post("/register-new-user", formInputValidator.validateBuyerRegistrationInputs, authCTRL.buyerRegistrationController);

   router.post("/login", authCTRL.loginController);

   router.post("/sign-out", authCTRL.signOutController);

   router.post("/register-new-seller", authCTRL.sellerRegistrationController);

   router.post("/verify-register-user", authCTRL.userVerifyTokenController);

} catch (error: any) {

}


module.exports = router;