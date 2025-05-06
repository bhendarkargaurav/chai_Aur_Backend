// require('dotenv').config() // this line made inconsistancy in the code
import dotenv from "dotenv"

// import mongoose from "mongoose"
// import { DB_Name } from "./constants.js"  
import connectDB from "./db/db.js"

dotenv.config({path: "./env"});


connectDB();














/* first aproch
import express from "express"
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
        console.log("Connected to MongoDB")
        app.on('error', (error) => {
            console.error("Error", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        })

    } catch (error) {
        console.error("Error", error)
        throw error
        
    }
})()
*/