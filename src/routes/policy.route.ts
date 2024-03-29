import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT } = require("../middlewares/auth.middleware");
const {privacyPolicy, updatePolicy} = require("../controllers/policy.controller");

try {
   router.get("/privacy-policy", privacyPolicy);
   router.put("/update-policy/:policyId", verifyJWT, updatePolicy);
} catch (error:any) {
   console.log(error?.message);
}

module.exports = router;