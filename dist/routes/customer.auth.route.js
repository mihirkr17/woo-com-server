"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { loginSystem, registrationSystem, } = require("../controllers/customer.auth.controller");
// modified
router.post("/registration", registrationSystem);
router.post("/login", loginSystem);
module.exports = router;
