import express, { Router } from "express";
const router: Router = express.Router();

const {
  loginSystem,
  registrationSystem,
} = require("../controllers/customer.auth.controller");

// modified
router.post("/registration", registrationSystem);

router.post("/login", loginSystem);

module.exports = router;
