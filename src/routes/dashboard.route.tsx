import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, isPermitForDashboard } = require("../middleware/Auth.middleware");
const dashboardCTL = require("../controllers/dashboard/dashboardController");

try {

   router.get("/overview", verifyJWT, isPermitForDashboard, dashboardCTL?.dashboardOverview);

} catch (error: any) {

}

module.exports = router;