const multer = require("multer");
const path = require('path');
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


cloudinary.config = {
   cloud_name: process.env.CLOUDINARY_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET
}

const storage = new CloudinaryStorage({
   cloudinary: cloudinary,
   params: {
      folder: 'review-images',
      // format: async (req: any, file: any) => 'png', // supports promises as well
      allowedFormats: ['jpg', 'png'],
      // public_id: (req, file) => 'computed-filename-using-request',
      transformation: [{ width: 500, height: 500, crop: 'limit' }],
   },
});

module.exports = multer({ storage: storage });


// module.exports = multer({
//    storage: multer.diskStorage({}),
//    limits: { fileSize: 500000 }
// })

// module.exports = multer({
//    storage: multer.diskStorage({
//       filename: (req: any, file: any, cb: any) => {
//              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//              const extension = path.extname(file.originalname);
//              cb(null, file.fieldname + '-' + uniqueSuffix + extension);
//            }
//       }), // Use the default disk storage
//    limits: {
//       fileSize: 10 * 1024 * 1024 // Set the maximum file size (optional)
//    },
//    fileFilter: (req: any, file: any, cb: any) => {
//       // Implement any file filtering logic if needed
//       cb(null, true);
//    }
// });


// multer.diskStorage({


// destination: './public/uploads',
// filename: (req: any, file: any, cb: any) => {
//   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//   const extension = path.extname(file.originalname);
//   cb(null, file.fieldname + '-' + uniqueSuffix + extension);
// },
// });

// module.exports = upload;

