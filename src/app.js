import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN, // allow only this origin to access the server
    credentials: true, // allow cookies to be sent with requests
}))

app.use(express.json({limit: "20kb"})) // parse json data from request body

app.use(express.urlencoded({extended: true, limit: "20kb"})) // parse urlencoded data from request body

app.use(express.static('public')) // serve static files from public directory like img pdf

app.use(cookieParser()) // parse cookies from request headers


export { app }