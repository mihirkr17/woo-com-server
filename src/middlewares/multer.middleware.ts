const absPath = require("path");
const multerPackage = require("multer");

const { Error400: e400 } = require("../res/response");

const {
  validBDPhoneNumber: validBdPhoneNumber,
} = require("../utils/validator");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function validateInputs(body: any, cb: any) {
  const { docId, contactPhone, countryCode }: any = body;
  const cCodec = ["+880"];

  if (!countryCode || !cCodec.includes(countryCode)) {
    return cb(new e400("Invalid country code format!"));
  }

  if (!validBdPhoneNumber(contactPhone)) {
    return cb(new e400("Invalid phone number format!"));
  }

  if (!docId) {
    return cb(new e400("Required document id number!"));
  }

  return true;
}

function uploads(dest: string, param: string) {
  if (!dest || dest.length <= 0)
    throw new Error("Required destination folder name!");

  const storage = multerPackage.diskStorage({
    destination: function (req: any, file: any, cb: any) {
      cb(null, absPath.resolve(__dirname, "../../public", dest));
    },
    filename: function (req: any, file: any, cb: any) {
      let pathName: string = "";

      if (!file.originalname) return cb(new Error("No image found!"));

      if (param === "SVD") {
        const { docId } = req?.body;

        validateInputs(req?.body, cb);

        pathName = docId;
      } else {
        pathName = file.originalname.split(" ").join("_").replace(".", "_");
      }

      if (!pathName || pathName === "") {
        return cb(new Error("Required photo absPath name!"));
      }

      cb(
        null,
        pathName + "_" + Date.now() + absPath.extname(file.originalname)
      );
    },
  });
  return multerPackage({ storage: storage });
}

module.exports = uploads;
