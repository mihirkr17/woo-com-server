"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { verifyJWT, checkingOwnerOrAdmin } = require("../middleware/auth");
const router = express_1.default.Router();
const { fetchAuthUser, signUser, signOutUser, switchRole, updateProfileData, makeAdmin, demoteToUser, manageUsers, makeSellerRequest, permitSellerRequest, checkSellerRequest, userLoginController, userRegisterController } = require("../controllers/users/users.controller");
try {
    /**
     * @api {get} /fetch the authorize user data
     * @apiDescription this endpoint will display all the information about one individual user data
     * @apiPermission for any authorize user who logged in.
     * @apiHeaders {String} authorization --> user email address required.
     * @apiParams no params required.
     * @apiSuccess {one particular user object data}
     */
    router.get("/fetch-auth-user", verifyJWT, fetchAuthUser);
    /**
     * @api {put} /sign in the user
     * @apiDescription this endpoint will save the currently login or sign up user data to the database with role
     * @apiPermission for any one who trying to sign up or sign in.
     * @apiHeaders {String} authorization --> user email address required.
     * @apiBody {String} displayName of user required.
     * @apiParams no params required.
     * @apiSuccess sending success message.
     */
    router.post("/sign-user", signUser);
    router.post("/login-user", userLoginController);
    router.post("/register-user", userRegisterController);
    router.post("/sign-out", verifyJWT, signOutUser);
    router.put("/switch-role/:role", verifyJWT, switchRole);
    router.put("/update-profile-data/:email", verifyJWT, updateProfileData);
    router.put("/make-admin/:userId", verifyJWT, checkingOwnerOrAdmin, makeAdmin);
    router.put("/demote-to-user/:userId", verifyJWT, checkingOwnerOrAdmin, demoteToUser);
    router.get("/manage-user", manageUsers);
    router.put("/make-seller-request/:userEmail", makeSellerRequest);
    router.put("/permit-seller-request/:userId", verifyJWT, checkingOwnerOrAdmin, permitSellerRequest);
    router.get("/check-seller-request", checkSellerRequest);
}
catch (error) {
    console.log(error === null || error === void 0 ? void 0 : error.message);
}
module.exports = router;
