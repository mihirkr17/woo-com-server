import express, { Router } from "express";
const router: Router = express.Router();
const userGetController = require("../controllers/auth/users/usersControllerGet");
const userPostController = require("../controllers/auth/users/usersControllerPost");
const userPutController = require("../controllers/auth/users/usersControllerPut");
const shippingAddressController = require("../controllers/shippingAddressController");

// Middleware
const userRegisterMiddleware = require("../middleware/userRegisterMiddleware");
const { verifyJWT, checkingOwnerOrAdmin, verifyAuthUserByJWT } = require("../middleware/auth");

try {
  /**
   * @api {get} /fetch the authorize user data
   * @apiDescription this endpoint will display all the information about one individual user data
   * @apiPermission for any authorize user who logged in.
   * @apiHeaders {String} authorization --> user email address required.
   * @apiParams no params required.
   * @apiSuccess {one particular user object data}
   */
  router.get("/fau", verifyAuthUserByJWT, userGetController.fetchAuthUser);

  /**
   * @api {put} /sign in the user
   * @apiDescription this endpoint will save the currently login or sign up user data to the database with role
   * @apiPermission for any one who trying to sign up or sign in.
   * @apiHeaders {String} authorization --> user email address required.
   * @apiBody {String} displayName of user required.
   * @apiParams no params required.
   * @apiSuccess sending success message.
   */
  router.post("/login-user", userPostController.userLoginController);

  router.post("/register-user", userRegisterMiddleware, userPostController.userRegisterController);

  router.post("/verify-register-user", userPostController.userRegisterVerify);

  router.post("/sign-out", userPostController.signOutUser);

  router.put("/update-profile-data", verifyJWT, userPutController.updateProfileData);

  router.put("/make-admin/:userId", verifyJWT, checkingOwnerOrAdmin, userPutController.makeAdmin);

  router.put(
    "/demote-to-user/:userId",
    verifyJWT,
    checkingOwnerOrAdmin,
    userPutController.demoteToUser
  );
  router.get("/manage-user", userGetController.manageUsers);

  router.put("/make-seller-request", verifyJWT, userPutController.makeSellerRequest);

  router.put(
    "/permit-seller-request",
    verifyJWT,
    checkingOwnerOrAdmin,
    userPutController.permitSellerRequest
  );

  router.get("/check-seller-request", userGetController.checkSellerRequest);


  // Shipping address route
  router.post("/shipping-address", verifyJWT, shippingAddressController.createShippingAddress);
  router.put("/shipping-address", verifyJWT, shippingAddressController.updateShippingAddress);
  router.post("/shipping-address-select", verifyJWT, shippingAddressController.selectShippingAddress);
  router.delete("/shipping-address-delete/:_SA_UID", verifyJWT, shippingAddressController.deleteShippingAddress);

  router.post("/register-new-seller", userPostController.sellerRegisterController);
  
} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
