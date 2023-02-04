"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const authCTRL = require("../controllers/auth/authentication");
const formInputValidator = require("../middleware/FormInputValidator.middleware");
try {
    router.post("/register-new-user", formInputValidator.validateBuyerRegistrationInputs, authCTRL.buyerRegistrationController);
    router.post("/login", authCTRL.loginController);
    router.post("/sign-out", authCTRL.signOutController);
    router.post("/register-new-seller", authCTRL.sellerRegistrationController);
    router.post("/verify-register-user", authCTRL.userVerifyTokenController);
}
catch (error) {
}
module.exports = router;
