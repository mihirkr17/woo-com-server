"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const usersCTRL = require("../controllers/users.controller");
// Middleware
const { verifyJWT } = require("../middlewares/auth.middleware");
/**
 * @api {get} /fetch the authorize user data
 * @apiDescription this endpoint will display all the information about one individual user data
 * @apiPermission for any authorize user who logged in.
 * @apiHeaders {String} authorization --> user email address required.
 * @apiParams no params required.
 * @apiSuccess {one particular user object data}
 */
router.get("/fau", verifyJWT, usersCTRL === null || usersCTRL === void 0 ? void 0 : usersCTRL.fetchAuthUser);
/**
 * @api {put} /sign in the user
 * @apiDescription this endpoint will save the currently login or sign up user data to the database with role
 * @apiPermission for any one who trying to sign up or sign in.
 * @apiHeaders {String} authorization --> user email address required.
 * @apiBody {String} displayName of user required.
 * @apiParams no params required.
 * @apiSuccess sending success message.
 */
router.get("/buyer/address-book", verifyJWT, usersCTRL === null || usersCTRL === void 0 ? void 0 : usersCTRL.fetchAddressBook);
router.put("/buyer/update-profile-data", verifyJWT, usersCTRL.updateProfileData);
// Shipping address route
router.post("/buyer/shipping-address", verifyJWT, usersCTRL.createShippingAddress);
router.put("/buyer/shipping-address", verifyJWT, usersCTRL.updateShippingAddress);
router.post("/buyer/shipping-address-select", verifyJWT, usersCTRL.selectShippingAddress);
router.delete("/buyer/shipping-address-delete/:id", verifyJWT, usersCTRL.deleteShippingAddress);
module.exports = router;
