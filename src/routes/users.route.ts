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
router.get("/fau", verifyJWT, usersCTRL?.fetchAuthUserSystem);

/**
 * @api {put} /sign in the user
 * @apiDescription this endpoint will save the currently login or sign up user data to the database with role
 * @apiPermission for any one who trying to sign up or sign in.
 * @apiHeaders {String} authorization --> user email address required.
 * @apiBody {String} displayName of user required.
 * @apiParams no params required.
 * @apiSuccess sending success message.
 */

router.get("/customer/address-book", verifyJWT, usersCTRL?.fetchAddressBookSystem);

router.put(
  "/customer/update-profile-data",
  verifyJWT,
  usersCTRL.updateProfileDataSystem
);
// Shipping address route
router.post(
  "/customer/shipping-address",
  verifyJWT,
  usersCTRL.createShippingAddressSystem
);
router.put(
  "/customer/shipping-address",
  verifyJWT,
  usersCTRL.updateShippingAddressSystem
);
router.post(
  "/customer/shipping-address-select",
  verifyJWT,
  usersCTRL.selectShippingAddressSystem
);
router.delete(
  "/customer/shipping-address-delete/:id",
  verifyJWT,
  usersCTRL.deleteShippingAddressSystem
);

router.put(
  "/customer/password-update",
  verifyJWT,
  usersCTRL?.passwordChangeSystem
);

module.exports = router;
