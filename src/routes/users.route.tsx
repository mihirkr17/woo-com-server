import express, { Router } from "express";
const router: Router = express.Router();
const shippingAddressController = require("../controllers/users/ShippingAddress.controller");
const userCTRL = require("../controllers/users/users");

// Middleware
const { verifyJWT, isRoleOwnerOrAdmin } = require("../middleware/auth");

try {
  /**
   * @api {get} /fetch the authorize user data
   * @apiDescription this endpoint will display all the information about one individual user data
   * @apiPermission for any authorize user who logged in.
   * @apiHeaders {String} authorization --> user email address required.
   * @apiParams no params required.
   * @apiSuccess {one particular user object data}
   */
  router.get("/fau", verifyJWT, userCTRL.fetchAuthUserController);

  /**
   * @api {put} /sign in the user
   * @apiDescription this endpoint will save the currently login or sign up user data to the database with role
   * @apiPermission for any one who trying to sign up or sign in.
   * @apiHeaders {String} authorization --> user email address required.
   * @apiBody {String} displayName of user required.
   * @apiParams no params required.
   * @apiSuccess sending success message.
   */

  router.put("/update-profile-data", verifyJWT, userCTRL.updateProfileDataController);

  router.put("/make-admin/:userId", verifyJWT, isRoleOwnerOrAdmin, userCTRL.makeAdminController);

  router.put(
    "/demote-to-user/:userId",
    verifyJWT,
    isRoleOwnerOrAdmin,
    userCTRL.demoteToUser
  );
  router.get("/manage-user", userCTRL.manageUsersController);

  router.put("/make-seller-request", verifyJWT, userCTRL.makeSellerRequest);

  router.put(
    "/permit-seller-request",
    verifyJWT,
    isRoleOwnerOrAdmin,
    userCTRL.permitSellerRequest
  );

  router.get("/check-seller-request", userCTRL.checkSellerRequestController);


  // Shipping address route
  router.post("/shipping-address", verifyJWT, shippingAddressController.createShippingAddress);
  router.put("/shipping-address", verifyJWT, shippingAddressController.updateShippingAddress);
  router.post("/shipping-address-select", verifyJWT, shippingAddressController.selectShippingAddress);
  router.delete("/shipping-address-delete/:_SA_UID", verifyJWT, shippingAddressController.deleteShippingAddress);

} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
