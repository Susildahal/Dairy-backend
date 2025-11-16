import mongoose from "mongoose";
import dotenv from "dotenv";
import createAdminFromEnv from "../utils/createAdminUser.js";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory (one level up from src)
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Track if seeding has been done
let seedingComplete = false;

const mongodbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully to Local Database!');
    
    // Only seed once per application run
    if (!seedingComplete) {
      await createAdminFromEnv();
    
      seedingComplete = true;
      console.log('Initial seeding completed.');
    }
    
    return mongoose.connection;
  } catch (error) {
    console.error("❌ Database connection error:", error);
    throw error;
  }
};

export default mongodbConnection;