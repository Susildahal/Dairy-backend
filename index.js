//imports
import express from "express";
import dotenv from "dotenv";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.join(__dirname, './.env') });

import cors from "cors";
import cookieParser from "cookie-parser";
const port = process.env.PORT || 5000;
import bodyParser from "body-parser";
import mongodbConnection from "./src/config/dbconnections.js";
import { errorHandlerMiddleware } from "./src/middleware/errorHandler.js";
import monthRouter from "./src/routes/month.js";
import userRouter from "./src/routes/user.js";
import milkrouter from "./src/routes/milk.js";
import settingrouter from "./src/routes/sitesetting.js"

//middleware
const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS Configuration - supports multiple origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173' ,'https://dairyadmin.vercel.app/'];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));

// Routesc
app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.get('/api/ping', (req, res) => {
    res.send('Pong!');
});

// API routes
app.use('/api/months', monthRouter);
app.use('/api/users', userRouter);
app.use('/api/milk', milkrouter);
app.use('/api/setting', settingrouter);

// Error handler middleware - must be used after all routes
app.use(errorHandlerMiddleware);

 const api = async () =>{
    try {
        const response = await axios.get('https://dairy-backend-hwt2.onrender.com/api/ping');
console.log(`Public IP Address: ${response.data}`);
        
    } catch (error) {
        console.error('Error fetching public IP address:', error);
    }

}

setTimeout(() => {  
    api();
}, 10 * 60 * 1000 ); // 10 minutes interval


   

// Start server
mongodbConnection()
.then(() => {
    app.listen(port, "0.0.0.0", () => {
        console.log(`Server is running on port ${port}`);
    });
})
.catch((error) => {
    console.error("Error starting server:", error);
});