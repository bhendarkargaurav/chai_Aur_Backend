import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const registerUser = asyncHandler(async (req, res) => {
    // return res.status(200).json({
    //     message: "Chai aur code"
    // })

    //get user detail from frountend
    // validation - not empty
    // check if user already exist: username, email
    //check for img, check for avatar
    //upload them on cloudinary, avatar
    // create user object - create entry in db
    // remove pass and refresh token feild from response
    //check for user creation
    // return res

    const { fullname, email, username, password} = req.body

    if (                  // check its true or not using this method of code
        [fullname, email, username, password].some((field) =>  // any of the above present dont show error
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({ // check wheather exixting user is there or not
        $or: [{username}, {email}]
    })
    if(existedUser) {
        throw new ApiError(409, "User with email and password already exixt")
    }
    
    // lines extract the local file paths
    // const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log("Incoming files:", req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path || null;
    console.log("avatar local patha", avatarLocalPath)


    const coverImageLocalPath = req.files?.coverimage?.[0]?.path || null;

    if(!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required");
    }
    
    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverimage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
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