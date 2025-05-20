import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

// functionality to manage access and refresh token
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // save refresh token to database
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) // save without ant=y validation

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


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
    // console.log("Incoming files:", req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path || null;


    // const coverImageLocalPath = req.files?.coverimage?.[0]?.path || null;
    //doing using clasic way
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
        coverImageLocalPath = req.files.coverimage[0].path
    }

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

const loginUser = asyncHandler(async (req, res) => {
    // req body se data
    //username / email
    //fine the user
    //password check
    //access and refresh token
    // send cookie

    const {email, username, password} = req.body

    if (!( email || username)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, "password not match")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    //send the cookie
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: accessToken, refreshToken 
            },
            "User Logged In Successfully"
        )
    )
})

// here big role of middleware
const LogOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,

        {
            $set: {
                refreshToken: undefined
            }
            
        },
        {
            new: true //want to see new value
        }
    )
    console.log("user id", req.user._id);

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})

//endpoint if the access token expire then generate new ones
const refreshAccssToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    // verify (token) refresh token
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
        // find the user
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }
    
        // also check with the refresh token ehich is stored in user model
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token expired or used")
        }
    
        // all are verify and match now generate new tokens
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken), options
        .cookie("accessToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, newrefreshToken},
                "access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
    
})

export {
    registerUser,
    loginUser,
    LogOutUser,
    refreshAccssToken
}