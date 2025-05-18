import { Router } from "express";
import { loginUser, LogOutUser, LogOutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

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
    ]),
    registerUser
)

router.route("/login").post(loginUser)


//secure routes
router.route("/logout").post(verifyJWT, LogOutUser)

export default router
