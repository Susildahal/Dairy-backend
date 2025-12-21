//imports
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory (one level up from src)
dotenv.config({ path: path.join(__dirname, '../.env') });

import cors from "cors";
import cookieParser from "cookie-parser";
const port = process.env.PORT || 5000;
import bodyParser from "body-parser";
import mongodbConnection from "./config/dbconnections.js";
import { errorHandlerMiddleware } from "./middleware/errorHandler.js";
import monthRouter from "./routes/month.js";
import userRouter from "./routes/user.js";
import milkrouter from "./routes/milk.js";
import settingrouter from "./routes/sitesetting.js"




//middleware
const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // Added cookie-parser middleware


const corsOptions = {
    origin: ["http://localhost:5173", "https://dairy-frontend-eight.vercel.app/"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true
};

app.use(cors(corsOptions));

// Routesc
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// API routes
app.use('/api/months', monthRouter);
app.use('/api/users', userRouter);
app.use('/api/milk', milkrouter);
app.use('/api/setting', settingrouter);


// Error handler middleware - must be used after all routes
app.use(errorHandlerMiddleware);

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