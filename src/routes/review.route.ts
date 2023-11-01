import express, { Router } from "express";
const router: Router = express.Router();
const { verifyJWT, isCustomer } = require("../middlewares/auth.middleware");
const { addProductRating, getReviews, getMyReviews, toggleVotingLike, getProductDetails } = require("../controllers/buyer.review.controller");



// Set up multer middleware to handle file uploads
// const storage = multer.diskStorage({
//   destination: './public/uploads',
//   filename: (req: any, file: any, cb: any) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     const extension = path.extname(file.originalname);
//     cb(null, file.fieldname + '-' + uniqueSuffix + extension);
//   },
// });


// const ImageUpload = multer({ storage });


router.post("/add-product-rating", verifyJWT, addProductRating);

router.get("/product-review/:productID", getReviews);

router.get("/my-reviews/:uuid", verifyJWT, isCustomer, getMyReviews)

router.post("/toggle-vote", verifyJWT, toggleVotingLike);

router.get(`/product-details`, verifyJWT, getProductDetails);


module.exports = router;
