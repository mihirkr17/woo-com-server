import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT } = require("../middleware/Auth.middleware");
const {privacyPolicy, updatePolicy} = require("../controllers/policy/policy.controller");

try {
   router.get("/privacy-policy", privacyPolicy);
   router.put("/update-policy/:policyId", verifyJWT, updatePolicy);
} catch (error:any) {
   console.log(error?.message);
}

module.exports = router;