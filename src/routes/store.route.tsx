import express, { Router } from "express";
const router: Router = express.Router();
const { getStore } = require("../controllers/store/store.controller");

try {
   router.get(`/storeName`, getStore);

} catch (error: any) {
   console.log(error?.message);
}


module.exports = router;