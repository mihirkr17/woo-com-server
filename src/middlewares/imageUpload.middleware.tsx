// const multer = require("multer");
// const path = require('path');

// // Set up multer middleware to handle file uploads
// const storage = multer.diskStorage({
//    destination: './public/uploads',
//    filename: (req: any, file: any, cb: any) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//       const extension = path.extname(file.originalname);
//       cb(null, file.fieldname + '-' + uniqueSuffix + extension);
//    },
// });


// const ImageUpload = multer({ storage });

// module.exports.ImageUpload = (req:Request) => {

// };