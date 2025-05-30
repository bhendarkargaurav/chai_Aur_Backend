import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// functionality to manage access and refresh token
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // save refresh token to database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // save without ant=y validation

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

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

  const { fullname, email, username, password } = req.body;

  if (
    // check its true or not using this method of code
    [fullname, email, username, password].some(
      (
        field // any of the above present dont show error
      ) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    // check wheather exixting user is there or not
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email and password already exixt");
  }

  // lines extract the local file paths
  // const avatarLocalPath = req.files?.avatar[0]?.path;
  // console.log("Incoming files:", req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path || null;

  // const coverImageLocalPath = req.files?.coverimage?.[0]?.path || null;
  //doing using clasic way
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverimage) &&
    req.files.coverimage.length > 0
  ) {
    coverImageLocalPath = req.files.coverimage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required");
  }

  // upload on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverimage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registerd successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body se data
  //username / email
  //fine the user
  //password check
  //access and refresh token
  // send cookie

  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "password not match");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //send the cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

// here big role of middleware
const LogOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,

    {
      $unset: {
        refreshToken: 1,  // this remove the field from document
      },
    },
    {
      new: true, //want to see new value
    }
  );
  console.log("user id", req.user._id);

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

//endpoint if the access token expire then generate new ones
const refreshAccssToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  // verify (token) refresh token
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("the decoded valkue is of token is", decodedToken);
    // find the user
    const user = await User.findById(decodedToken?._id);
    console.log("the user is", user);

    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    // also check with the refresh token ehich is stored in user model
    if (incomingRefreshToken !== user?.refreshToken) {        //  optional chaining operator.
      throw new ApiError(401, "Refresh token expired or used");
    }

    // all are verify and match now generate new tokens
    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
          new ApiResponse(
            200,
            { accessToken, newrefreshToken },
            "access token refreshed"
          )
    );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(
    200, 
    req.user, 
    "current user fetched successfully"
  ));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }
  //User.findByIdAndUpdate = It returns the document before update by default, but you can change this using { new: true }.
  const user = await User.findByIdAndUpdate(
    req.user?._id,  //Optional chaining (?.) is used to safely access
    {
      $set: {
        fullname,    /// we can use both way
        email: email
      },
    },
    { new: true }
  ).select("-password") // exclude the pass..

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Accound details updated successfully"))
});

//update files
const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarlocalPath = req.file?.path

    if(!avatarlocalPath) {
        throw new ApiError(400, "avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarlocalPath)

    if (!avatar.url){
        throw new ApiError(400, "Erroe while iploading avatar")
    }

    // update file
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar:avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "avatar image uploaded succeessfully")
    )
})
 

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImagelocalPath = req.file?.path

    if(!coverImagelocalPath) {
        throw new ApiError(400, "cover image file is missing")
    }

    const coverimage = await uploadOnCloudinary(coverImagelocalPath)

    if (!coverimage.url){
        throw new ApiError(400, "Erroe while uploading ")
    }
    // update file
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverimage:coverimage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "cover image uploaded succeessfully")
    )
})

//aggregation pipeline is used here
const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    // console.log("Requesting channel for username:", username);


    if(!username?.trim()) {           // to remove whitespaces
        throw new ApiError(400, "username is missing")
    }
    // find the doc using username
    const channel = await User.aggregate([
        //first  pipeline 
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            // to find subscriber
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            // to find to how much channele we follow/subscribe
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
    
        {
            $project: {
                fullname:1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount:1,
                isSubscribed: 1,
                coverimage: 1,
                avatar: 1,
                email: 1

            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )

})

// aggregation for wathched history
const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [   // this is how we can manage nexted pipeline
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1
                  }
                },
                {
                  $addFields: {
                    owner: {
                      $first: "$owner"
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ])
  return res
  .status(200)
  .json(
    new ApiResponse(200, 
      user[0].getWatchHistory,
      "Watch History Fetched Successfully"
    )
  )
}) 

export {
  registerUser,
  loginUser,
  LogOutUser,
  refreshAccssToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
