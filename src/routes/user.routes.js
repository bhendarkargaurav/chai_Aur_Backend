import { Router } from "express";
import { loginUser, LogOutUser, registerUser, refreshAccssToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },                            // middleware
        {
            name: "coverimage",
            maxCount: 1
        }
    ]),registerUser
)
router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, LogOutUser)      // verifyJWT from auth middleware

router.route("/refresh-Token").post(refreshAccssToken)
export default router
