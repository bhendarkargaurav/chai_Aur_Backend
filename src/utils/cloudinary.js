import {v2 as cloudinary} from "cloudinary"
import fs from "fs"



  // Configuration code from cloudinary 
  cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

// creating one method getting the path of local server inside the parameter of method, i will upload and if its aploaded successfuly i will unlink with local
const uploadOnCloudinary = async (lacalFilePath) => {
    try {
        if(!lacalFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(lacalFilePath, {
            resource_type: "auto"
        })
        // file has been aploaded sucessfully
        // console.log("file is aploaded on cloudinary", response.url);
        fs.unlinkSync(lacalFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(lacalFilePath)// remove the locally saved temp files as the upload operation got sucess
        return null;
    }
}

export {uploadOnCloudinary}


// cloudinary.v2.uploader.upload('https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', 
//     { public_id: "olympic_flag"},
// function(error, result) {console.log(result);});
