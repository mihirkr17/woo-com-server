"use strict";
const absPath = require("path");
const multerPackage = require("multer");
const { Error400: e400 } = require("../res/response");
const { validBDPhoneNumber: validBdPhoneNumber, } = require("../utils/validator");
const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png",
};
function validateInputs(body, cb) {
    const { docId, contactPhone, countryCode } = body;
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
function uploads(dest, param) {
    if (!dest || dest.length <= 0)
        throw new Error("Required destination folder name!");
    const storage = multerPackage.diskStorage({
        destination: function (req, file, cb) {
            cb(null, absPath.resolve(__dirname, "../../public", dest));
        },
        filename: function (req, file, cb) {
            let pathName = "";
            if (!file.originalname)
                return cb(new Error("No image found!"));
            if (param === "SVD") {
                const { docId } = req === null || req === void 0 ? void 0 : req.body;
                validateInputs(req === null || req === void 0 ? void 0 : req.body, cb);
                pathName = docId;
            }
            else {
                pathName = file.originalname.split(" ").join("_").replace(".", "_");
            }
            if (!pathName || pathName === "") {
                return cb(new Error("Required photo absPath name!"));
            }
            cb(null, pathName + "_" + Date.now() + absPath.extname(file.originalname));
        },
    });
    return multerPackage({ storage: storage });
}
module.exports = uploads;
