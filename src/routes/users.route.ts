import express, { Router } from "express";
const router: Router = express.Router();
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
router.get("/fau", verifyJWT, usersCTRL?.fetchAuthUser);

/**
 * @api {put} /sign in the user
 * @apiDescription this endpoint will save the currently login or sign up user data to the database with role
 * @apiPermission for any one who trying to sign up or sign in.
 * @apiHeaders {String} authorization --> user email address required.
 * @apiBody {String} displayName of user required.
 * @apiParams no params required.
 * @apiSuccess sending success message.
 */

router.get("/buyer/address-book", verifyJWT, usersCTRL?.fetchAddressBook);

router.put("/update-profile-data", verifyJWT, usersCTRL.updateProfileData);
// Shipping address route
router.post("/shipping-address", verifyJWT, usersCTRL.createShippingAddress);
router.put("/shipping-address", verifyJWT, usersCTRL.updateShippingAddress);
router.post("/shipping-address-select", verifyJWT, usersCTRL.selectShippingAddress);
router.delete("/shipping-address-delete/:addrsID", verifyJWT, usersCTRL.deleteShippingAddress);



module.exports = router;
