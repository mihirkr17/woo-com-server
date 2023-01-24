"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, isPermitForDashboard } = require("../middleware/Auth.middleware");
const dashboardCTL = require("../controllers/dashboard/dashboardController");
try {
    router.get("/overview", verifyJWT, isPermitForDashboard, dashboardCTL === null || dashboardCTL === void 0 ? void 0 : dashboardCTL.dashboardOverview);
}
catch (error) {
}
module.exports = router;
