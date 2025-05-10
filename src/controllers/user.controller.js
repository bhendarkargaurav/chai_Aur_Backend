import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User } from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    // return res.status(200).json({
    //     message: "Chai aur code"
    // })

    //get user detail from frountend
    // validation - not empty
    // check if user already exist: username, email
    //check for img, checkfor avatar
    //upload them on cloudinary, avatar
    // create user object - create entry in db
    // remove pass and refresh token feild from response
    //check for user creation
    // return res

    const { fullname, email, username,  password} = req.body
    console.log("email is ", email);

    if (                  // check its true or not using this method of code
        [fullname, email, username, password].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser) {
        throw new ApiError(409, "User with email and password already exixt")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }
     
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registerd successfully")
    )

})
export {
    registerUser
}