import { Router } from "express";
import { 
    loginUser, 
    LogOutUser, 
    registerUser, 
    refreshAccssToken, 
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
    } from "../controllers/user.controller.js";
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

router.route("/changepassword").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-accound").patch(verifyJWT, updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/update-coverimage").patch(verifyJWT, upload.single("coverimage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/watchhistory").get(verifyJWT, getWatchHistory)

export default router


