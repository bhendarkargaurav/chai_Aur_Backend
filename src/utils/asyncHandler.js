// using promise

const asyncHandler = (requestHandler) => {
    (req,res, next) => {
        Promise.resolve(requestHandler(req, res, next)).
        reject((err) => next(err))
    }
}

export { asyncHandler }




 


// using try catch

// const asyncHandle = (fu) => async(req, res, next) => {
//     try {
//         await fu(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }