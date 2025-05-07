import multer from "multer";


// will get loacl file path
const storage = multer.diskStorage({   // we are using diskstorage there is also a memory storage
    destination: function (req, file, cb) { // cb is cqallback, and what is this file we have the req
        // that we receive via body req(like json) but not file i.e why multer or express uploader
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) // the file upladed by user is a same name
    }
})
 
export const upload = multer({ 
    storage,
})