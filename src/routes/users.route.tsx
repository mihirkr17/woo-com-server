import express, { Router } from "express";
const { verifyJWT, verifyAuth } = require("../middleware/auth");
const router: Router = express.Router();
const {
  fetchAuthUser,
  signUser,
  signOutUser,
  switchRole,
  updateProfileData,
  makeAdmin,
  demoteToUser,
  manageUsers,
  makeSellerRequest,
  permitSellerRequest,
  checkSellerRequest,
} = require("../controllers/users/users.controller");

try {
  /**
   * @api {get} /fetch the authorize user data
   * @apiDescription this endpoint will display all the information about one individual user data
   * @apiPermission for any authorize user who logged in.
   * @apiHeaders {String} authorization --> user email address required.
   * @apiParams no params required.
   * @apiSuccess {one particular user object data}
   */
  router.get("/fetch-auth-user", fetchAuthUser);

  /**
   * @api {put} /sign in the user
   * @apiDescription this endpoint will save the currently login or sign up user data to the database with role
   * @apiPermission for any one who trying to sign up or sign in.
   * @apiHeaders {String} authorization --> user email address required.
   * @apiBody {String} displayName of user required.
   * @apiParams no params required.
   * @apiSuccess sending success message.
   */
  router.put("/sign-user", signUser);
  router.get("/sign-out", signOutUser);
  router.put("/switch-role/:role", verifyJWT, switchRole);
  router.put("/update-profile-data/:email", verifyJWT, updateProfileData);
  router.put("/make-admin/:userId", verifyJWT, verifyAuth, makeAdmin);
  router.put("/demote-to-user/:userId", verifyJWT, verifyAuth, demoteToUser);
  router.get("/manage-user", manageUsers);
  router.put("/make-seller-request/:userEmail", makeSellerRequest);
  router.put(
    "/permit-seller-request/:userId",
    verifyJWT,
    verifyAuth,
    permitSellerRequest
  );
  router.get("/check-seller-request", checkSellerRequest);
} catch (error: any) {
  console.log(error?.message);
}

module.exports = router;
