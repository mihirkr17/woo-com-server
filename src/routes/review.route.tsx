import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, isRoleBuyer } = require("../middlewares/auth.middleware");
const { addProductRating } = require("../controllers/review/review.controller");
const multer = require("multer");
const path = require('path');



// Set up multer middleware to handle file uploads
const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  },
});


const ImageUpload = multer({ storage });

try {
  router.post("/add-product-rating", ImageUpload.array('images', 5), addProductRating);
} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
