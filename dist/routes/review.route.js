"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { verifyJWT, isRoleBuyer } = require("../middlewares/auth.middleware");
const { addProductRating } = require("../controllers/review/review.controller");
const multer = require("multer");
const path = require('path');
// Set up multer middleware to handle file uploads
const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    },
});
const ImageUpload = multer({ storage });
try {
    router.post("/add-product-rating", ImageUpload.array('images', 5), addProductRating);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
